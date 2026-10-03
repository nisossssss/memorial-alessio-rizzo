import { neon } from '@neondatabase/serverless'
import { isAdminAuthenticated } from '../server/adminAuth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({
      error: 'Metodo non consentito.',
    })
  }

  try {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({
        error: 'Sessione scaduta.',
      })
    }

    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      throw new Error('Configurazione mancante.')
    }

    const sql = neon(databaseUrl)

    const standings = await sql`
      WITH valid_votes AS (
        SELECT v.match_id, v.player_id
        FROM mvp_votes AS v
        JOIN matches AS m
          ON m.id = v.match_id
          AND m.tournament_id = v.tournament_id
        JOIN tournaments AS t ON t.id = m.tournament_id
        JOIN players AS p
          ON p.id = v.player_id
          AND p.tournament_id = t.id
        WHERE t.slug = ${slug}
          AND m.status = 'completed'
          AND EXISTS (
            SELECT 1 FROM team_players AS tp
            WHERE tp.player_id = p.id
              AND tp.team_id IN (m.team_a_id, m.team_b_id)
          )
      ),
      totals AS (
        SELECT match_id, COUNT(*) AS total_votes
        FROM valid_votes
        GROUP BY match_id
      ),
      player_votes AS (
        SELECT match_id, player_id, COUNT(*) AS votes
        FROM valid_votes
        GROUP BY match_id, player_id
      ),
      performances AS (
        SELECT DISTINCT
          p.id AS player_id,
          m.id AS match_id,
          COALESCE(pv.votes, 0) AS votes,
          totals.total_votes,
          CASE m.phase
            WHEN 'group' THEN 1.0
            WHEN 'semifinal' THEN 1.5
            WHEN 'placement_5_6' THEN 1.5
            WHEN 'final' THEN 2.0
          END AS weight
        FROM players AS p
        JOIN tournaments AS t ON t.id = p.tournament_id
        JOIN team_players AS tp ON tp.player_id = p.id
        JOIN teams AS tm
          ON tm.id = tp.team_id
          AND tm.tournament_id = t.id
        JOIN matches AS m
          ON m.tournament_id = t.id
          AND tm.id IN (m.team_a_id, m.team_b_id)
        JOIN totals ON totals.match_id = m.id
        LEFT JOIN player_votes AS pv
          ON pv.match_id = m.id
          AND pv.player_id = p.id
        WHERE t.slug = ${slug}
          AND m.status = 'completed'
      ),
      scores AS (
        SELECT
          player_id,
          SUM(votes) AS votes,
          COUNT(*) AS counted_matches,
          SUM(weight) AS total_weight,
          SUM(
            100.0 * votes / total_votes * weight
          ) / SUM(weight) AS score
        FROM performances
        GROUP BY player_id
      )
      SELECT
        p.id,
        p.name,
        tm.name AS team_name,
        COALESCE(s.votes, 0)::integer AS votes,
        COALESCE(s.counted_matches, 0)::integer AS counted_matches,
        s.score,
        DENSE_RANK() OVER (
          ORDER BY
            s.score DESC NULLS LAST,
            COALESCE(s.votes, 0) DESC
        ) AS position
      FROM players AS p
      JOIN tournaments AS t ON t.id = p.tournament_id
      LEFT JOIN team_players AS tp ON tp.player_id = p.id
      LEFT JOIN teams AS tm
        ON tm.id = tp.team_id
        AND tm.tournament_id = t.id
      LEFT JOIN scores AS s ON s.player_id = p.id
      WHERE t.slug = ${slug}
      ORDER BY
        s.score DESC NULLS LAST,
        COALESCE(s.votes, 0) DESC,
        p.name,
        p.id
    `

    return res.status(200).json({ standings })
  } catch {
    return res.status(500).json({
      error: 'Impossibile leggere la classifica MVP.',
    })
  }
}