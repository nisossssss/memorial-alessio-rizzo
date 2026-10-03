import { useState } from 'react'
import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom'

import useDialogs from '../../components/ui/useDialogs'
import { getMatchScore } from '../../domain/tournamentRules'
import { useTournament } from '../../state/TournamentContext'

export default function AdminMatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirm } = useDialogs()

  const {
    tournament,
    refreshTournament,
    refreshing,
  } = useTournament()

  const [teamAScore, setTeamAScore] = useState('')
  const [teamBScore, setTeamBScore] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const match = tournament.matches.find(
    (item) => item.id === id,
  )

  const disabled = busy || refreshing

  function getTeamName(teamId) {
    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? 'Da definire'
    )
  }

  async function sendAction(action) {
    if (!match || disabled) return

    if (action === 'reset') {
      const confirmed = await confirm({
        eyebrow: 'Gestione partita',
        title: 'Azzerare il risultato?',
        message: 'Tutti i set registrati per questa partita verranno rimossi.',
        confirmLabel: 'Azzera partita',
        tone: 'danger',
      })

      if (!confirmed) return
    }

    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/admin-match', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Request': '1',
        },
        body: JSON.stringify({
          id: match.id,
          action,
          expectedSets: match.sets,
          ...(action === 'add_set'
            ? {
                teamAScore: Number(teamAScore),
                teamBScore: Number(teamBScore),
              }
            : {}),
        }),
      })

      const contentType =
        response.headers.get('content-type') ?? ''

      if (!contentType.includes('application/json')) {
        throw new Error(
          'API admin-match non disponibile. Verifica il file e riavvia Vercel.',
        )
      }

      const result = await response.json()

      if (response.status === 401) {
        navigate('/admin-login', { replace: true })
        return
      }

      if (!response.ok) {
        if (response.status === 409) {
          refreshTournament()
        }

        throw new Error(
          result.error ?? 'Salvataggio non riuscito.',
        )
      }

      setTeamAScore('')
      setTeamBScore('')
      refreshTournament()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Impossibile contattare il server.',
      )
    } finally {
      setBusy(false)
    }
  }

  const completed = match?.status === 'completed'
  const ready = Boolean(match?.teamAId && match?.teamBId)
  const score = getMatchScore(match?.sets ?? [])

  return (
    <section>
      <p>
        <Link to="/admin">← Amministrazione</Link>
        {' · '}
        <Link to="/admin/partite">Gestione partite</Link>
      </p>

      {!match ? (
        <h2>Partita non trovata</h2>
      ) : (
        <>
          <h2>
            {getTeamName(match.teamAId)}
            {' vs '}
            {getTeamName(match.teamBId)}
          </h2>

          <p>
            Stato: <strong>{match.status}</strong>
          </p>

          <h3>{score.teamA} - {score.teamB}</h3>

          {!ready && (
            <p>
              Le squadre saranno assegnate automaticamente
              al termine della fase precedente.
            </p>
          )}

          <h3>Set registrati</h3>

          {match.sets.length === 0 ? (
            <p>Nessun set registrato.</p>
          ) : (
            <ol>
              {match.sets.map((set, index) => (
                <li key={index}>
                  {set.teamAScore} - {set.teamBScore}
                </li>
              ))}
            </ol>
          )}

          {completed && (
            <p>
              Vincitrice:{' '}
              <strong>
                {getTeamName(
                  score.teamA > score.teamB
                    ? match.teamAId
                    : match.teamBId,
                )}
              </strong>
            </p>
          )}

          {ready && !completed && (
            <>
              {match.status === 'scheduled' && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('start')}
                >
                  Avvia partita live
                </button>
              )}

              {match.status === 'live' && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendAction('add_set')
                  }}
                >
                  <h3>Salva risultato del set</h3>

                  <label>
                    {getTeamName(match.teamAId)}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      disabled={disabled}
                      value={teamAScore}
                      onChange={(event) =>
                        setTeamAScore(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    {getTeamName(match.teamBId)}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      disabled={disabled}
                      value={teamBScore}
                      onChange={(event) =>
                        setTeamBScore(event.target.value)
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={disabled}
                  >
                    Salva set
                  </button>
                </form>
              )}

              {(match.status === 'live' ||
                match.sets.length > 0) && (
                <p>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => sendAction('reset')}
                  >
                    Azzera partita
                  </button>
                </p>
              )}
            </>
          )}

          {error && <p role="alert">{error}</p>}

          <button
            type="button"
            disabled={disabled}
            onClick={refreshTournament}
          >
            Aggiorna dati
          </button>
        </>
      )}
    </section>
  )
}