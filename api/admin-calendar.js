import { neon } from '@neondatabase/serverless';
import { randomInt } from 'node:crypto';

import {
    isAdminAuthenticated,
    isAdminMutationRequest,
} from '../server/adminAuth.js';

function shuffle(items) {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function createCalendar(teamIds) {
  const shuffled = shuffle(teamIds)

  const groups = [
    { id: 'A', teamIds: shuffled.slice(0, 3) },
    { id: 'B', teamIds: shuffled.slice(3, 6) },
  ]

  const assignments = groups.flatMap((group) =>
    group.teamIds.map((id) => ({
      id,
      group_id: group.id,
    })),
  )

  const matches = groups.flatMap((group) => {
    const [first, second, third] = group.teamIds

    return [
      [first, second],
      [first, third],
      [second, third],
    ].map(([teamA, teamB], index) => ({
      public_id: `group-${group.id}-${index + 1}`,
      phase: 'group',
      group_id: group.id,
      team_a_id: teamA,
      team_b_id: teamB,
    }))
  })

  matches.push(
    {
      public_id: 'semifinal-1',
      phase: 'semifinal',
      group_id: null,
      team_a_id: null,
      team_b_id: null,
    },
    {
      public_id: 'semifinal-2',
      phase: 'semifinal',
      group_id: null,
      team_a_id: null,
      team_b_id: null,
    },
    {
      public_id: 'placement-5-6',
      phase: 'placement_5_6',
      group_id: null,
      team_a_id: null,
      team_b_id: null,
    },
    {
      public_id: 'final',
      phase: 'final',
      group_id: null,
      team_a_id: null,
      team_b_id: null,
    },
  )

  return { assignments, matches }
}

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

    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      return res.status(500).json({
        error: 'Configurazione database incompleta.',
      })
    }

    const sql = neon(databaseUrl)

    const teams = await sql`
      SELECT tm.id
      FROM teams AS tm
      JOIN tournaments AS t
        ON t.id = tm.tournament_id
      WHERE t.slug = ${slug}
      ORDER BY tm.id
    `

    if (teams.length !== 6) {
      return res.status(409).json({
        error: 'Prima del calendario devono esistere 6 squadre.',
      })
    }

    const calendar = createCalendar(
      teams.map((team) => team.id),
    )

    const assignmentsJson = JSON.stringify(
      calendar.assignments,
    )

    const matchesJson = JSON.stringify(calendar.matches)

    const [tournaments, result] = await sql.transaction(
      [
        sql`
          SELECT id
          FROM tournaments
          WHERE slug = ${slug}
          FOR UPDATE
        `,
        sql`
          WITH assignments AS (
            SELECT *
            FROM jsonb_to_recordset(
              ${assignmentsJson}::jsonb
            ) AS a(id uuid, group_id text)
          ),
          eligible AS (
            SELECT t.id
            FROM tournaments AS t
            WHERE t.slug = ${slug}
              AND t.status = 'draw'
              AND NOT EXISTS (
                SELECT 1 FROM matches
                WHERE tournament_id = t.id
              )
              AND (
                SELECT COUNT(*) FROM teams
                WHERE tournament_id = t.id
              ) = 6
              AND (
                SELECT COUNT(*)
                FROM teams AS tm
                JOIN assignments AS a ON a.id = tm.id
                WHERE tm.tournament_id = t.id
                  AND tm.group_id IS NULL
              ) = 6
              AND NOT EXISTS (
                SELECT 1
                FROM teams AS tm
                WHERE tm.tournament_id = t.id
                  AND (
                    SELECT COUNT(*)
                    FROM team_players AS tp
                    JOIN players AS p
                      ON p.id = tp.player_id
                    WHERE tp.team_id = tm.id
                      AND p.tournament_id = t.id
                  ) <> 8
              )
              AND (
                SELECT COUNT(DISTINCT tp.player_id)
                FROM team_players AS tp
                JOIN teams AS tm ON tm.id = tp.team_id
                WHERE tm.tournament_id = t.id
              ) = 48
          ),
          assigned_teams AS (
            UPDATE teams AS tm
            SET group_id = a.group_id
            FROM assignments AS a, eligible AS e
            WHERE tm.id = a.id
              AND tm.tournament_id = e.id
            RETURNING tm.id
          ),
          inserted_matches AS (
            INSERT INTO matches (
              tournament_id,
              public_id,
              phase,
              group_id,
              team_a_id,
              team_b_id
            )
            SELECT
              e.id,
              m.public_id,
              m.phase,
              m.group_id,
              m.team_a_id,
              m.team_b_id
            FROM eligible AS e
            CROSS JOIN jsonb_to_recordset(
              ${matchesJson}::jsonb
            ) AS m(
              public_id text,
              phase text,
              group_id text,
              team_a_id uuid,
              team_b_id uuid
            )
            WHERE (SELECT COUNT(*) FROM assigned_teams) = 6
            RETURNING id
          )
          UPDATE tournaments AS t
          SET
            status = 'group_stage',
            updated_at = now()
          WHERE t.id IN (SELECT id FROM eligible)
            AND (SELECT COUNT(*) FROM inserted_matches) = 10
          RETURNING t.id
        `,
      ],
      { isolationLevel: 'ReadCommitted' },
    )

    if (!tournaments.length) {
      return res.status(404).json({
        error: 'Torneo non trovato.',
      })
    }

    if (!result.length) {
      return res.status(409).json({
        error:
          'Calendario già presente oppure squadre non pronte. Servono 6 squadre distinte da 8 partecipanti, senza gironi assegnati, nella fase draw.',
      })
    }

    return res.status(201).json({
      success: true,
      matchesCount: 10,
    })
  } catch {
    return res.status(500).json({
      error: 'Impossibile salvare il calendario.',
    })
  }
}