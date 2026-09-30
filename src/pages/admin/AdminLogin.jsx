import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_SESSION_KEY = 'memorial-admin-auth'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    setError('')

    if (code !== import.meta.env.VITE_ADMIN_CODE) {
      setError('Codice non valido.')
      return
    }

    sessionStorage.setItem(
      ADMIN_SESSION_KEY,
      'authenticated',
    )

    navigate('/admin')
  }

  return (
    <section>
      <h2>Accesso amministratore</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Codice admin

          <input
            type="password"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            autoComplete="off"
          />
        </label>

        <button type="submit">
          Accedi
        </button>
      </form>

      {error && (
        <p>{error}</p>
      )}
    </section>
  )
}