import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')

    return res.status(405).json({
      error: 'Metodo non consentito.',
    })
  }

  const databaseUrl = process.env.DATABASE_URL
  const tournamentSlug = process.env.TOURNAMENT_SLUG

  if (!databaseUrl || !tournamentSlug) {
    return res.status(500).json({
      error:
        'Configurazione server incompleta: servono DATABASE_URL e TOURNAMENT_SLUG.',
    })
  }

  try {
    const sql = neon(databaseUrl)

    // Una sola query: torneo e dati collegati vengono
    // letti nello stesso snapshot del database.
    const rows = await sql`
      SELECT
        t.id,
        t.slug,
        t.name,
        t.edition,
        t.status,
        t.updated_at,
        (
          SELECT m.public_id
          FROM matches AS m
          WHERE m.id = t.live_match_id
            AND m.tournament_id = t.id
        ) AS live_match_public_id,
        (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'name', p.name
              )
              ORDER BY p.name, p.id
            ),
            '[]'::jsonb
          )
          FROM players AS p
          WHERE p.tournament_id = t.id
        ) AS players,
        (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', tm.id,
                'name', tm.name,
                'groupId', tm.group_id,
                'players', (
                  SELECT COALESCE(
                    jsonb_agg(
                      jsonb_build_object(
                        'id', p.id,
                        'name', p.name
                      )
                      ORDER BY p.name, p.id
                    ),
                    '[]'::jsonb
                  )
                  FROM team_players AS tp
                  JOIN players AS p
                    ON p.id = tp.player_id
                  WHERE tp.team_id = tm.id
                    AND p.tournament_id = t.id
                )
              )
              ORDER BY tm.created_at, tm.id
            ),
            '[]'::jsonb
          )
          FROM teams AS tm
          WHERE tm.tournament_id = t.id
        ) AS teams,
        (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', m.public_id,
                'databaseId', m.id,
                'phase', m.phase,
                'groupId', m.group_id,
                'teamAId', m.team_a_id,
                'teamBId', m.team_b_id,
                'status', m.status,
                'sets', m.sets,
                'scheduledAt', m.scheduled_at
              )
              ORDER BY
                CASE m.phase
                  WHEN 'group' THEN 1
                  WHEN 'semifinal' THEN 2
                  WHEN 'placement_5_6' THEN 3
                  WHEN 'final' THEN 4
                END,
                m.public_id
            ),
            '[]'::jsonb
          )
          FROM matches AS m
          WHERE m.tournament_id = t.id
        ) AS matches
      FROM tournaments AS t
      WHERE t.slug = ${tournamentSlug}
      LIMIT 1
    `

    const tournament = rows[0]

    if (!tournament) {
      return res.status(404).json({
        error:
          'Torneo non trovato. Verifica TOURNAMENT_SLUG e la tabella tournaments.',
      })
    }

    const groups = ['A', 'B']
      .map((groupId) => ({
        id: groupId,
        name: `Girone ${groupId}`,
        teamIds: tournament.teams
          .filter((team) => team.groupId === groupId)
          .map((team) => team.id),
      }))
      .filter((group) => group.teamIds.length > 0)

    return res.status(200).json({
      tournament: {
        id: tournament.id,
        slug: tournament.slug,
        name: tournament.name,
        edition: tournament.edition,
        status: tournament.status,
        teams: tournament.teams,
        groups,
        matches: tournament.matches,
        liveMatchId: tournament.live_match_public_id,
        updatedAt: tournament.updated_at,
      },
      players: tournament.players,
    })
  } catch {
    // Non restituiamo al browser dettagli del database
    // o della connection string.
    return res.status(500).json({
      error: 'Impossibile leggere il torneo dal database.',
    })
  }
}