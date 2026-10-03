import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting) return

    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin-session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Request': '1',
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (!response.ok || !result.authenticated) {
        throw new Error(
          result.error ?? 'Accesso non riuscito.',
        )
      }

      setPassword('')
      navigate('/admin', { replace: true })
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Impossibile contattare il server.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Accesso amministratore</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Password admin
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
            value={password}
            disabled={submitting}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
    </section>
  )
}