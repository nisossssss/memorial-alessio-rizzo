import {
    createHash,
    createHmac,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto'

const COOKIE_NAME = 'memorial_admin_session'
const SESSION_SECONDS = 8 * 60 * 60

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret || secret.length < 64) {
    throw new Error('Configurazione sessione non valida.')
  }

  return secret
}

function sign(value) {
  return createHmac('sha256', getSecret())
    .update(value)
    .digest('base64url')
}

function equalStrings(first, second) {
  const a = createHash('sha256').update(first).digest()
  const b = createHash('sha256').update(second).digest()

  return timingSafeEqual(a, b)
}

export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD

  if (!expected || expected.length < 16) {
    throw new Error('Configurazione password non valida.')
  }

  return (
    typeof password === 'string' &&
    password.length <= 1024 &&
    equalStrings(password, expected)
  )
}

export function createAdminSession() {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
      nonce: randomBytes(16).toString('hex'),
    }),
  ).toString('base64url')

  return `${payload}.${sign(payload)}`
}

export function isAdminAuthenticated(req) {
  // Controlla la configurazione anche in assenza del cookie.
  getSecret()

  const cookie = (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))

  if (!cookie) {
    return false
  }

  const token = cookie.slice(COOKIE_NAME.length + 1)

  if (token.length > 2048) {
    return false
  }

  const parts = token.split('.')

  if (parts.length !== 2) {
    return false
  }

  const [payload, signature] = parts

  if (!equalStrings(signature, sign(payload))) {
    return false
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    )

    return (
      session.role === 'admin' &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Date.now()
    )
  } catch {
    return false
  }
}

export function setAdminCookie(res, token) {
  const secure =
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'

  res.setHeader(
    'Set-Cookie',
    [
      `${COOKIE_NAME}=${token}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${token ? SESSION_SECONDS : 0}`,
      ...(secure ? ['Secure'] : []),
    ].join('; '),
  )
}

// Richiede un header che le normali richieste cross-site
// non possono aggiungere senza autorizzazione CORS.
// Non abilitare CORS sulle API admin.
export function isAdminMutationRequest(req) {
  return (
    req.headers['x-admin-request'] === '1' &&
    (
      !req.headers['sec-fetch-site'] ||
      ['same-origin', 'none'].includes(
        req.headers['sec-fetch-site'],
      )
    )
  )
}