import { neon } from '@neondatabase/serverless'

import {
    isAdminAuthenticated,
    isAdminMutationRequest,
} from '../server/adminAuth.js'

import {
    advanceTournament,
    getScore,
    validateSet,
} from '../server/matchProgress.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')

    return res.status(405).json({
      error: 'Metodo non consentito.',
    })
  }

  try {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({
        error: 'Sessione scaduta. Accedi nuovamente.',
      })
    }

    if (!isAdminMutationRequest(req)) {
      return res.status(403).json({
        error: 'Richiesta non consentita.',
      })
    }

    if (
      !(req.headers['content-type'] ?? '')
        .startsWith('application/json')
    ) {
      return res.status(415).json({
        error: 'È richiesto JSON.',
      })
    }

    let body = req.body

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({
          error: 'JSON non valido.',
        })
      }
    }

    if (
      typeof body?.id !== 'string' ||
      !['start', 'add_set', 'reset'].includes(body?.action) ||
      !Array.isArray(body?.expectedSets)
    ) {
      return res.status(400).json({
        error: 'Richiesta non valida.',
      })
    }

    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      return res.status(500).json({
        error: 'Configurazione database incompleta.',
      })
    }

    const sql = neon(databaseUrl)

    const rows = await sql`
      SELECT
        t.id,
        t.status,
        t.live_match_id,
        (
          SELECT COALESCE(
            jsonb_agg(to_jsonb(m) ORDER BY m.id),
            '[]'::jsonb
          )
          FROM matches AS m
          WHERE m.tournament_id = t.id
        ) AS matches,
        (
          SELECT COALESCE(
            jsonb_agg(to_jsonb(tm) ORDER BY tm.id),
            '[]'::jsonb
          )
          FROM teams AS tm
          WHERE tm.tournament_id = t.id
        ) AS teams
      FROM tournaments AS t
      WHERE t.slug = ${slug}
    `

    const tournament = rows[0]

    if (!tournament) {
      return res.status(404).json({
        error: 'Torneo non trovato.',
      })
    }

    const originalMatches = JSON.stringify(
      tournament.matches,
    )

    const matches = structuredClone(tournament.matches)

    const match = matches.find(
      (item) => item.public_id === body.id,
    )

    if (!match) {
      return res.status(404).json({
        error: 'Partita non trovata.',
      })
    }

    if (
      !match.team_a_id ||
      !match.team_b_id ||
      match.team_a_id === match.team_b_id
    ) {
      return res.status(409).json({
        error: 'Le squadre della partita non sono ancora definite.',
      })
    }

    if (match.status === 'completed') {
      return res.status(409).json({
        error: 'La partita è conclusa e il risultato è bloccato.',
      })
    }

    if (
      JSON.stringify(body.expectedSets) !==
      JSON.stringify(match.sets)
    ) {
      return res.status(409).json({
        error: 'Il risultato è cambiato. Aggiorna i dati prima di riprovare.',
      })
    }

    let liveMatchId = tournament.live_match_id

    if (body.action === 'reset') {
      match.sets = []
      match.status = 'scheduled'

      if (liveMatchId === match.id) {
        liveMatchId = null
      }
    } else {
      if (
        liveMatchId &&
        liveMatchId !== match.id
      ) {
        return res.status(409).json({
          error: 'Un’altra partita è live. Concludila o azzerala prima di avviarne un’altra.',
        })
      }

      if (body.action === 'add_set') {
        if (match.status !== 'live') {
          return res.status(409).json({
            error: 'Avvia prima la partita.',
          })
        }

        try {
          validateSet(
            body.teamAScore,
            body.teamBScore,
          )
        } catch (validationError) {
          return res.status(400).json({
            error: validationError.message,
          })
        }

        if (match.sets.length >= 3) {
          return res.status(409).json({
            error: 'La partita ha già 3 set.',
          })
        }

        match.sets.push({
          teamAScore: body.teamAScore,
          teamBScore: body.teamBScore,
        })
      }

      const score = getScore(match.sets)

      match.status =
        score.teamA >= 2 || score.teamB >= 2
          ? 'completed'
          : 'live'

      liveMatchId =
        match.status === 'completed' ? null : match.id
    }

    let nextStatus

    try {
      nextStatus = advanceTournament(
        tournament.teams,
        matches,
      )
    } catch (progressError) {
      return res.status(409).json({
        error: progressError.message,
      })
    }

    const updatedMatches = JSON.stringify(
      matches.map((item) => ({
        id: item.id,
        team_a_id: item.team_a_id,
        team_b_id: item.team_b_id,
        sets: item.sets,
        status: item.status,
      })),
    )

    const [, changed] = await sql.transaction(
      [
        sql`
          SELECT id FROM tournaments
          WHERE id = ${tournament.id}::uuid
          FOR UPDATE
        `,
        sql`
          WITH eligible AS (
            SELECT t.id
            FROM tournaments AS t
            WHERE t.id = ${tournament.id}::uuid
              AND t.status = ${tournament.status}
              AND t.live_match_id IS NOT DISTINCT FROM
                ${tournament.live_match_id}::uuid
              AND (
                SELECT jsonb_agg(to_jsonb(m) ORDER BY m.id)
                FROM matches AS m
                WHERE m.tournament_id = t.id
              ) = ${originalMatches}::jsonb
          ),
          changed_matches AS (
            UPDATE matches AS m
            SET
              team_a_id = incoming.team_a_id,
              team_b_id = incoming.team_b_id,
              sets = incoming.sets,
              status = incoming.status,
              updated_at = now()
            FROM eligible AS e,
              jsonb_to_recordset(
                ${updatedMatches}::jsonb
              ) AS incoming(
                id uuid,
                team_a_id uuid,
                team_b_id uuid,
                sets jsonb,
                status text
              )
            WHERE m.id = incoming.id
              AND m.tournament_id = e.id
            RETURNING m.id
          )
          UPDATE tournaments AS t
          SET
            status = ${nextStatus},
            live_match_id = ${liveMatchId}::uuid,
            updated_at = now()
          WHERE t.id IN (SELECT id FROM eligible)
            AND (
              SELECT COUNT(*) FROM changed_matches
            ) = ${matches.length}
          RETURNING t.id
        `,
      ],
      { isolationLevel: 'ReadCommitted' },
    )

    if (!changed.length) {
      return res.status(409).json({
        error: 'I dati sono cambiati durante il salvataggio. Aggiorna e riprova.',
      })
    }

    return res.status(200).json({ success: true })
  } catch {
    return res.status(500).json({
      error: 'Impossibile salvare la partita.',
    })
  }
}