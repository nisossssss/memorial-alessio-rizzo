import {
  checkAdminPassword,
  createAdminSession,
  isAdminAuthenticated,
  isAdminMutationRequest,
  setAdminCookie,
} from '../server/adminAuth.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE')

    return res.status(405).json({
      error: 'Metodo non consentito.',
    })
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        authenticated: isAdminAuthenticated(req),
      })
    }

    if (!isAdminMutationRequest(req)) {
      return res.status(403).json({
        error: 'Richiesta non consentita.',
      })
    }

    if (req.method === 'DELETE') {
      setAdminCookie(res, '')

      return res.status(200).json({
        authenticated: false,
      })
    }

    const contentType = req.headers['content-type'] ?? ''

    if (!contentType.startsWith('application/json')) {
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

    if (!checkAdminPassword(body?.password)) {
      return res.status(401).json({
        error: 'Password non valida.',
      })
    }

    setAdminCookie(res, createAdminSession())

    return res.status(200).json({
      authenticated: true,
    })
  } catch {
    return res.status(500).json({
      error:
        'Configurazione admin non valida. Controlla ADMIN_PASSWORD (almeno 16 caratteri) e ADMIN_SESSION_SECRET (almeno 64 caratteri).',
    })
  }
}