import { neon } from '@neondatabase/serverless'

import {
    isAdminAuthenticated,
    isAdminMutationRequest,
} from '../server/adminAuth.js'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')

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

    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      return res.status(500).json({
        error: 'Configurazione database incompleta.',
      })
    }

    const sql = neon(databaseUrl)

    if (req.method === 'GET') {
      const tournaments = await sql`
        SELECT id
        FROM tournaments
        WHERE slug = ${slug}
      `

      if (!tournaments.length) {
        return res.status(404).json({
          error: 'Torneo non trovato.',
        })
      }

      const players = await sql`
        SELECT id, name
        FROM players
        WHERE tournament_id = ${tournaments[0].id}
        ORDER BY name, id
      `

      return res.status(200).json({ players })
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
        error: 'È richiesto un corpo JSON.',
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

    const id = body?.id
    const name =
      typeof body?.name === 'string'
        ? body.name.trim().replace(/\s+/g, ' ')
        : ''

    if (
      req.method !== 'DELETE' &&
      (name.length < 2 || name.length > 100)
    ) {
      return res.status(400).json({
        error: 'Il nome deve contenere da 2 a 100 caratteri.',
      })
    }

    if (
      req.method !== 'POST' &&
      (typeof id !== 'string' || !UUID_PATTERN.test(id))
    ) {
      return res.status(400).json({
        error: 'Identificatore partecipante non valido.',
      })
    }

    // Tutte le operazioni di questa API bloccano la stessa
    // riga del torneo, serializzando le modifiche concorrenti.
    const lockTournament = sql`
      SELECT id
      FROM tournaments
      WHERE slug = ${slug}
      FOR UPDATE
    `

    let mutation

    if (req.method === 'POST') {
      mutation = sql`
        INSERT INTO players (tournament_id, name)
        SELECT t.id, ${name}
        FROM tournaments AS t
        WHERE t.slug = ${slug}
          AND t.status = 'setup'
          AND NOT EXISTS (
            SELECT 1 FROM teams
            WHERE tournament_id = t.id
          )
          AND (
            SELECT COUNT(*) FROM players
            WHERE tournament_id = t.id
          ) < 48
          AND NOT EXISTS (
            SELECT 1 FROM players
            WHERE tournament_id = t.id
              AND lower(name) = lower(${name})
          )
        RETURNING id, name
      `
    } else if (req.method === 'PATCH') {
      mutation = sql`
        UPDATE players AS p
        SET name = ${name}
        FROM tournaments AS t
        WHERE p.id = ${id}::uuid
          AND p.tournament_id = t.id
          AND t.slug = ${slug}
          AND t.status = 'setup'
          AND NOT EXISTS (
            SELECT 1 FROM teams
            WHERE tournament_id = t.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM players AS other
            WHERE other.tournament_id = t.id
              AND other.id <> p.id
              AND lower(other.name) = lower(${name})
          )
        RETURNING p.id, p.name
      `
    } else {
      mutation = sql`
        DELETE FROM players AS p
        USING tournaments AS t
        WHERE p.id = ${id}::uuid
          AND p.tournament_id = t.id
          AND t.slug = ${slug}
          AND t.status = 'setup'
          AND NOT EXISTS (
            SELECT 1 FROM teams
            WHERE tournament_id = t.id
          )
        RETURNING p.id, p.name
      `
    }

    const [tournaments, changedPlayers] =
      await sql.transaction(
        [lockTournament, mutation],
        { isolationLevel: 'ReadCommitted' },
      )

    if (!tournaments.length) {
      return res.status(404).json({
        error: 'Torneo non trovato.',
      })
    }

    if (!changedPlayers.length) {
      return res.status(409).json({
        error:
          'Modifica non eseguita: verifica che il torneo sia in setup senza squadre, che il nome non sia già presente e che il limite di 48 partecipanti non sia stato raggiunto. Per modifica o eliminazione, il partecipante deve ancora esistere.',
      })
    }

    return res
      .status(req.method === 'POST' ? 201 : 200)
      .json({ player: changedPlayers[0] })
  } catch {
    return res.status(500).json({
      error: 'Impossibile gestire i partecipanti.',
    })
  }
}