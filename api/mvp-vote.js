
import {
    createHash,
    createHmac,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto'

import { neon } from '@neondatabase/serverless'

const COOKIE_NAME = 'memorial_voter'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function signature(value) {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret || secret.length < 64) {
    throw new Error('Configurazione mancante.')
  }

  return createHmac('sha256', secret)
    .update(`mvp-voter:${value}`)
    .digest('hex')
}

function readVoter(req) {
  const cookie = (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))

  if (!cookie) return null

  const token = cookie.slice(COOKIE_NAME.length + 1)
  const [value, signed, extra] = token.split('.')

  if (
    extra !== undefined ||
    !/^[a-f0-9]{64}$/.test(value ?? '') ||
    !/^[a-f0-9]{64}$/.test(signed ?? '')
  ) {
    return null
  }

  const expected = signature(value)

  return timingSafeEqual(
    Buffer.from(signed, 'hex'),
    Buffer.from(expected, 'hex'),
  )
    ? value
    : null
}

function setVoterCookie(res, value) {
  const secure = ['production', 'preview'].includes(
    process.env.VERCEL_ENV,
  )

  res.setHeader(
    'Set-Cookie',
    [
      `${COOKIE_NAME}=${value}.${signature(value)}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/api/mvp-vote',
      'Max-Age=31536000',
      ...(secure ? ['Secure'] : []),
    ].join('; '),
  )
}

function voterKey(value) {
  return createHash('sha256').update(value).digest('hex')
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({
      error: 'Metodo non consentito.',
    })
  }

  try {
    const databaseUrl = process.env.DATABASE_URL
    const slug = process.env.TOURNAMENT_SLUG

    if (!databaseUrl || !slug) {
      throw new Error('Configurazione mancante.')
    }

    const sql = neon(databaseUrl)
    let voter = readVoter(req)

    if (req.method === 'GET') {
      const matchId = req.query.matchId

      if (
        typeof matchId !== 'string' ||
        matchId.length > 100
      ) {
        return res.status(400).json({
          error: 'Partita non valida.',
        })
      }

      const matches = await sql`
        SELECT m.id, m.status
        FROM matches AS m
        JOIN tournaments AS t ON t.id = m.tournament_id
        WHERE t.slug = ${slug}
          AND m.public_id = ${matchId}
      `

      if (!matches.length) {
        return res.status(404).json({
          error: 'Partita non trovata.',
        })
      }

      if (!voter) {
        voter = randomBytes(32).toString('hex')
        setVoterCookie(res, voter)
      }

      const votes = await sql`
        SELECT player_id
        FROM mvp_votes
        WHERE match_id = ${matches[0].id}
          AND voter_token = ${voterKey(voter)}
      `

      return res.status(200).json({
        open: matches[0].status === 'live',
        voted: votes.length > 0,
        playerId: votes[0]?.player_id ?? null,
      })
    }

    if (
      req.headers['x-mvp-request'] !== '1' ||
      (
        req.headers['sec-fetch-site'] &&
        !['same-origin', 'none'].includes(
          req.headers['sec-fetch-site'],
        )
      )
    ) {
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

    if (!voter) {
      return res.status(403).json({
        error: 'Ricarica la votazione e abilita i cookie.',
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
      typeof body?.matchId !== 'string' ||
      body.matchId.length > 100 ||
      typeof body?.playerId !== 'string' ||
      !UUID_PATTERN.test(body.playerId)
    ) {
      return res.status(400).json({
        error: 'Partita o giocatore non valido.',
      })
    }

    // Lo stesso lock usato dalle API risultati impedisce
    // che un voto venga inserito dopo la chiusura della partita.
    const [, votes] = await sql.transaction(
      [
        sql`
          SELECT id FROM tournaments
          WHERE slug = ${slug}
          FOR UPDATE
        `,
        sql`
          INSERT INTO mvp_votes (
            tournament_id,
            match_id,
            player_id,
            voter_token
          )
          SELECT
            t.id,
            m.id,
            p.id,
            ${voterKey(voter)}
          FROM tournaments AS t
          JOIN matches AS m ON m.tournament_id = t.id
          JOIN players AS p ON p.tournament_id = t.id
          WHERE t.slug = ${slug}
            AND m.public_id = ${body.matchId}
            AND m.status = 'live'
            AND p.id = ${body.playerId}::uuid
            AND EXISTS (
              SELECT 1
              FROM team_players AS tp
              WHERE tp.player_id = p.id
                AND tp.team_id IN (
                  m.team_a_id,
                  m.team_b_id
                )
            )
          ON CONFLICT (match_id, voter_token) DO NOTHING
          RETURNING player_id
        `,
      ],
      { isolationLevel: 'ReadCommitted' },
    )

    if (!votes.length) {
      return res.status(409).json({
        error:
          'Voto non registrato: hai già votato, la partita non è live oppure il giocatore non partecipa alla partita.',
      })
    }

    return res.status(201).json({
      voted: true,
      playerId: votes[0].player_id,
    })
  } catch {
    return res.status(500).json({
      error: 'Impossibile gestire la votazione.',
    })
  }
}