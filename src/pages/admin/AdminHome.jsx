import {
    Link,
    useNavigate,
} from 'react-router-dom'

import { useTournament } from '../../state/TournamentContext'

const ADMIN_SESSION_KEY = 'memorial-admin-auth'

export default function AdminHome() {
  const navigate = useNavigate()
  const { tournament } = useTournament()

  function handleLogout() {
    sessionStorage.removeItem(
      ADMIN_SESSION_KEY,
    )

    navigate('/admin-login')
  }

  return (
    <section>
      <h2>Amministrazione torneo</h2>

      <p>
        Stato torneo:{' '}
        <strong>
          {tournament.status}
        </strong>
      </p>

      <ul>
        <li>
          <Link to="/admin/sorteggio">
            Gestisci sorteggio
          </Link>
        </li>

        <li>
          <Link to="/admin/partite">
            Gestisci partite
          </Link>
        </li>
      </ul>

      <button onClick={handleLogout}>
        Esci
      </button>
    </section>
  )
}