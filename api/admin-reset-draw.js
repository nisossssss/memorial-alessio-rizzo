import { neon } from '@neondatabase/serverless'
import process from 'node:process'

import {
    isAdminAuthenticated,
    isAdminMutationRequest,
} from '../server/adminAuth.js'

const RESETTABLE_STATUSES = [
  'draw',
  'group_stage',
  'semifinals',
  'finals',
  'completed',
]

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE')
    return res.status(405).json({ error: 'Metodo non consentito.' })
  }

  try {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Sessione scaduta. Accedi nuovamente.' })
    }

    if (!isAdminMutationRequest(req)) {
      return res.status(403).json({ error: 'Richiesta non consentita.' })
    }

    if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
      return res.status(415).json({ error: 'È richiesto JSON.' })
    }

    let body = req.body

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({ error: 'JSON non valido.' })
      }
    }

    if (!['calendar', 'teams'].includes(body?.action)) {
      return res.status(400).json({ error: 'Tipo di reset non valido.' })
    }

    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      return res.status(500).json({ error: 'Configurazione database incompleta.' })
    }

    const sql = neon(databaseUrl)
    const result = body.action === 'calendar'
      ? await resetCalendar(sql, slug)
      : await resetTeams(sql, slug)

    if (!result.tournamentExists) {
      return res.status(404).json({ error: 'Torneo non trovato.' })
    }

    if (result.resetCount !== 1) {
      return res.status(409).json({ error: 'Reset non eseguito. Aggiorna i dati e riprova.' })
    }

    return res.status(200).json({ success: true, action: body.action })
  } catch {
    return res.status(500).json({ error: 'Impossibile ripristinare il sorteggio.' })
  }
}

async function resetCalendar(sql, slug) {
  const [tournaments, , , , , resetRows] = await sql.transaction([
    sql`SELECT id FROM tournaments WHERE slug = ${slug} FOR UPDATE`,
    sql`
      UPDATE tournaments AS t
      SET live_match_id = NULL, updated_at = now()
      WHERE t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
      RETURNING t.id
    `,
    sql`
      DELETE FROM mvp_votes AS v
      USING tournaments AS t
      WHERE v.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
    `,
    sql`
      DELETE FROM matches AS m
      USING tournaments AS t
      WHERE m.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
    `,
    sql`
      UPDATE teams AS tm
      SET group_id = NULL
      FROM tournaments AS t
      WHERE tm.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1 FROM matches AS m WHERE m.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
    `,
    sql`
      UPDATE tournaments AS t
      SET status = 'draw', live_match_id = NULL, updated_at = now()
      WHERE t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1 FROM matches AS m WHERE m.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
      RETURNING t.id
    `,
  ])

  return {
    tournamentExists: tournaments.length > 0,
    resetCount: resetRows.length,
  }
}

async function resetTeams(sql, slug) {
  const [tournaments, , , , , , resetRows] = await sql.transaction([
    sql`SELECT id FROM tournaments WHERE slug = ${slug} FOR UPDATE`,
    sql`
      UPDATE tournaments AS t
      SET live_match_id = NULL, updated_at = now()
      WHERE t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
      RETURNING t.id
    `,
    sql`
      DELETE FROM mvp_votes AS v
      USING tournaments AS t
      WHERE v.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
    `,
    sql`
      DELETE FROM matches AS m
      USING tournaments AS t
      WHERE m.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
    `,
    sql`
      DELETE FROM team_players AS tp
      USING teams AS tm, tournaments AS t
      WHERE tp.team_id = tm.id
        AND tm.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1 FROM matches AS m WHERE m.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
    `,
    sql`
      DELETE FROM teams AS tm
      USING tournaments AS t
      WHERE tm.tournament_id = t.id
        AND t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1
          FROM team_players AS tp
          JOIN teams AS other ON other.id = tp.team_id
          WHERE other.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM matches AS m WHERE m.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
    `,
    sql`
      UPDATE tournaments AS t
      SET status = 'setup', live_match_id = NULL, updated_at = now()
      WHERE t.slug = ${slug}
        AND t.status = ANY(${RESETTABLE_STATUSES}::text[])
        AND NOT EXISTS (
          SELECT 1 FROM teams AS tm WHERE tm.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM matches AS m WHERE m.tournament_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM mvp_votes AS v WHERE v.tournament_id = t.id
        )
      RETURNING t.id
    `,
  ])

  return {
    tournamentExists: tournaments.length > 0,
    resetCount: resetRows.length,
  }
}
