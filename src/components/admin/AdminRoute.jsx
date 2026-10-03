import { useEffect, useState } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

export default function AdminRoute() {
  const location = useLocation()

  const [session, setSession] = useState({
    path: null,
    authenticated: false,
    error: '',
  })

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch('/api/admin-session', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error ?? 'Verifica accesso non riuscita.',
          )
        }

        if (!controller.signal.aborted) {
          setSession({
            path: location.pathname,
            authenticated: result.authenticated === true,
            error: '',
          })
        }
      } catch (sessionError) {
        if (!controller.signal.aborted) {
          setSession({
            path: location.pathname,
            authenticated: false,
            error:
              sessionError instanceof Error
                ? sessionError.message
                : 'Impossibile verificare la sessione.',
          })
        }
      }
    }

    checkSession()

    return () => controller.abort()
  }, [location.pathname, attempt])

  if (session.path !== location.pathname) {
    return <p role="status">Verifica accesso…</p>
  }

  if (session.error) {
    return (
      <section>
        <p role="alert">{session.error}</p>

        <button
          type="button"
          onClick={() => {
            setSession({
              path: null,
              authenticated: false,
              error: '',
            })
            setAttempt((current) => current + 1)
          }}
        >
          Riprova
        </button>
      </section>
    )
  }

  if (!session.authenticated) {
    return <Navigate to="/admin-login" replace />
  }

  return <Outlet />
}