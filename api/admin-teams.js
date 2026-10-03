import { neon } from '@neondatabase/serverless'
import { randomInt, randomUUID } from 'node:crypto'

import {
    isAdminAuthenticated,
    isAdminMutationRequest,
} from '../server/adminAuth.js'

function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function shuffle(items) {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function drawTeams(players) {
  const linkedNames = [
    'Rimo Filomena',
    'Nuzzo Manuela',
  ].map(normalizeName)

  const linkedPlayers = linkedNames.map((name) => {
    const matches = players.filter(
      (player) => normalizeName(player.name) === name,
    )

    if (matches.length !== 1) {
      throw new Error(
        'Devono essere presenti una sola Rimo Filomena e una sola Nuzzo Manuela.',
      )
    }

    return matches[0]
  })

  const linkedIds = new Set(
    linkedPlayers.map((player) => player.id),
  )

  const others = shuffle(
    players.filter((player) => !linkedIds.has(player.id)),
  )

  const teams = Array.from({ length: 6 }, (_, index) => ({
    id: randomUUID(),
    name: `Squadra ${index + 1}`,
    players: [],
  }))

  const linkedTeamIndex = randomInt(6)
  teams[linkedTeamIndex].players.push(...linkedPlayers)

  let teamIndex = 0

  for (const player of others) {
    while (teams[teamIndex].players.length >= 8) {
      teamIndex = (teamIndex + 1) % 6
    }

    teams[teamIndex].players.push(player)
    teamIndex = (teamIndex + 1) % 6
  }

  return teams
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (!['POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'POST, PATCH')

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

    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      return res.status(500).json({
        error: 'Configurazione database incompleta.',
      })
    }

    const sql = neon(databaseUrl)

    const lockTournament = sql`
      SELECT id
      FROM tournaments
      WHERE slug = ${slug}
      FOR UPDATE
    `

    if (req.method === 'PATCH') {
      const id = body?.id
      const name =
        typeof body?.name === 'string'
          ? body.name.trim().replace(/\s+/g, ' ')
          : ''

      if (
        typeof id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
        name.length < 2 ||
        name.length > 80
      ) {
        return res.status(400).json({
          error: 'Squadra non valida o nome fuori dal limite di 2–80 caratteri.',
        })
      }

      const [tournaments, changed] = await sql.transaction(
        [
          lockTournament,
          sql`
            UPDATE teams AS tm
            SET name = ${name}
            FROM tournaments AS t
            WHERE tm.id = ${id}::uuid
              AND tm.tournament_id = t.id
              AND t.slug = ${slug}
              AND t.status = 'draw'
              AND NOT EXISTS (
                SELECT 1 FROM matches
                WHERE tournament_id = t.id
              )
              AND NOT EXISTS (
                SELECT 1 FROM teams AS other
                WHERE other.tournament_id = t.id
                  AND other.id <> tm.id
                  AND lower(other.name) = lower(${name})
              )
            RETURNING tm.id, tm.name
          `,
        ],
        { isolationLevel: 'ReadCommitted' },
      )

      if (!tournaments.length) {
        return res.status(404).json({
          error: 'Torneo non trovato.',
        })
      }

      if (!changed.length) {
        return res.status(409).json({
          error:
            'Nome già presente, squadra non trovata o nomi bloccati dopo la creazione del calendario.',
        })
      }

      return res.status(200).json({ team: changed[0] })
    }

    const tournaments = await sql`
      SELECT id, status
      FROM tournaments
      WHERE slug = ${slug}
    `

    const tournament = tournaments[0]

    if (!tournament) {
      return res.status(404).json({
        error: 'Torneo non trovato.',
      })
    }

    if (tournament.status !== 'setup') {
      return res.status(409).json({
        error: 'Il sorteggio delle squadre è già stato effettuato.',
      })
    }

    const players = await sql`
      SELECT id, name
      FROM players
      WHERE tournament_id = ${tournament.id}
      ORDER BY id
    `

    if (players.length !== 48) {
      return res.status(409).json({
        error: `Servono 48 partecipanti. Attualmente sono ${players.length}.`,
      })
    }

    let teams

    try {
      teams = drawTeams(players)
    } catch (drawError) {
      return res.status(409).json({
        error: drawError.message,
      })
    }

    const teamsJson = JSON.stringify(
      teams.map(({ id, name }) => ({ id, name })),
    )

    const assignmentsJson = JSON.stringify(
      teams.flatMap((team) =>
        team.players.map((player) => ({
          team_id: team.id,
          player_id: player.id,
          player_name: player.name,
        })),
      ),
    )

    // La seconda query verifica di nuovo stato e partecipanti
    // dopo aver acquisito il lock del torneo.
    const [, result] = await sql.transaction(
      [
        lockTournament,
        sql`
          WITH assignments AS (
            SELECT *
            FROM jsonb_to_recordset(
              ${assignmentsJson}::jsonb
            ) AS a(
              team_id uuid,
              player_id uuid,
              player_name text
            )
          ),
          eligible AS (
            SELECT t.id
            FROM tournaments AS t
            WHERE t.slug = ${slug}
              AND t.status = 'setup'
              AND NOT EXISTS (
                SELECT 1 FROM teams
                WHERE tournament_id = t.id
              )
              AND NOT EXISTS (
                SELECT 1 FROM matches
                WHERE tournament_id = t.id
              )
              AND (
                SELECT COUNT(*) FROM players
                WHERE tournament_id = t.id
              ) = 48
              AND (
                SELECT COUNT(*)
                FROM assignments AS a
                JOIN players AS p
                  ON p.id = a.player_id
                  AND p.name = a.player_name
                  AND p.tournament_id = t.id
              ) = 48
          ),
          inserted_teams AS (
            INSERT INTO teams (id, tournament_id, name)
            SELECT tm.id, e.id, tm.name
            FROM eligible AS e
            CROSS JOIN jsonb_to_recordset(
              ${teamsJson}::jsonb
            ) AS tm(id uuid, name text)
            RETURNING id
          ),
          inserted_members AS (
            INSERT INTO team_players (team_id, player_id)
            SELECT a.team_id, a.player_id
            FROM assignments AS a
            JOIN inserted_teams AS tm
              ON tm.id = a.team_id
            RETURNING team_id
          )
          UPDATE tournaments AS t
          SET status = 'draw', updated_at = now()
          WHERE t.id IN (SELECT id FROM eligible)
            AND (SELECT COUNT(*) FROM inserted_teams) = 6
            AND (SELECT COUNT(*) FROM inserted_members) = 48
          RETURNING t.id
        `,
      ],
      { isolationLevel: 'ReadCommitted' },
    )

    if (!result.length) {
      return res.status(409).json({
        error:
          'Il torneo o i partecipanti sono cambiati durante il sorteggio. Aggiorna la pagina e riprova.',
      })
    }

    return res.status(201).json({
      success: true,
    })
  } catch {
    return res.status(500).json({
      error: 'Impossibile salvare le squadre.',
    })
  }
}