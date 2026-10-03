import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import MvpStandings from '../../components/admin/MvpStandings'
import { useTournament } from '../../state/TournamentContext'

export default function AdminHome() {
  const navigate = useNavigate()
  const { tournament, players } = useTournament()

  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    setLoggingOut(true)
    setError('')

    try {
      const response = await fetch('/api/admin-session', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'X-Admin-Request': '1' },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Uscita non riuscita.')
      }

      navigate('/admin-login', { replace: true })
    } catch (logoutError) {
      setError(logoutError.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <section>
      <h2>Amministrazione torneo</h2>

      <p>
        Stato torneo: <strong>{tournament.status}</strong>
      </p>

      <p>
        Partecipanti: <strong>{players.length} / 48</strong>
      </p>

      <ul>
        <li>
          <Link to="/admin/partecipanti">Gestisci partecipanti</Link>
        </li>
        <li>
          <Link to="/squadre">Consulta squadre</Link>
        </li>
        <li>
          <Link to="/admin/sorteggio">Gestisci sorteggio</Link>
        </li>
        <li>
          <Link to="/admin/partite">Gestisci partite</Link>
        </li>
        <li>
          <a href="#mvp">Classifica MVP</a>
        </li>
      </ul>

      <button
        type="button"
        disabled={loggingOut}
        onClick={handleLogout}
      >
        {loggingOut ? 'Uscita in corso…' : 'Esci'}
      </button>

      {error && <p role="alert">{error}</p>}

      <MvpStandings />
    </section>
  )
}