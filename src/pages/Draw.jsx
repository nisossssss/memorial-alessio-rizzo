import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import useDialogs from '../components/ui/useDialogs'
import { useTournament } from '../state/TournamentContext'

export default function Draw() {
  const navigate = useNavigate()
  const { confirm } = useDialogs()

  const {
    tournament,
    players,
    refreshTournament,
    refreshing,
  } = useTournament()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [teamName, setTeamName] = useState('')

  const hasTeams = tournament.teams.length > 0
  const hasCalendar = tournament.matches.length > 0
  const disabled = busy || refreshing

  const canDraw =
    tournament.status === 'setup' &&
    !hasTeams &&
    players.length === 48

  const canCreateCalendar =
    tournament.status === 'draw' &&
    tournament.teams.length === 6 &&
    !hasCalendar &&
    tournament.groups.length === 0

  const canRename =
    tournament.status === 'draw' &&
    !hasCalendar

  async function sendRequest(url, method, body) {
    const response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Request': '1',
      },
      body: JSON.stringify(body),
    })

    const contentType =
      response.headers.get('content-type') ?? ''

    if (!contentType.includes('application/json')) {
      throw new Error(
        'API non disponibile. Verifica i file nella cartella api e riavvia vercel dev.',
      )
    }

    const result = await response.json()

    if (response.status === 401) {
      navigate('/admin-login', { replace: true })
      throw new Error('Sessione scaduta.')
    }

    if (!response.ok) {
      throw new Error(
        result.error ?? 'Operazione non riuscita.',
      )
    }
  }

  async function runOperation(url, method, body) {
    setBusy(true)
    setError('')

    try {
      await sendRequest(url, method, body)
      refreshTournament()
      return true
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Operazione non riuscita.',
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleDraw() {
    if (!canDraw || disabled) return

    const confirmed = await confirm({
      eyebrow: 'Sorteggio squadre',
      title: 'Procedere con il sorteggio?',
      message: 'Verranno create e salvate 6 squadre. Dopo il salvataggio i partecipanti saranno bloccati.',
      confirmLabel: 'Sorteggia squadre',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    await runOperation('/api/admin-teams', 'POST', {})
  }

  async function handleCalendar() {
    if (!canCreateCalendar || disabled || editingId) return

    const confirmed = await confirm({
      eyebrow: 'Calendario',
      title: 'Generare gironi e partite?',
      message: 'Saranno creati due gironi e 10 partite. Il torneo passerà alla fase a gironi e i nomi delle squadre saranno bloccati.',
      confirmLabel: 'Genera calendario',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    await runOperation('/api/admin-calendar', 'POST', {})
  }

  async function handleReset(action) {
    if (disabled || editingId) return

    const resetCalendar = action === 'calendar'
    const confirmed = await confirm({
      eyebrow: 'Ripristino sorteggio',
      title: resetCalendar
        ? 'Rimuovere gironi e calendario?'
        : 'Annullare tutto il sorteggio?',
      message: resetCalendar
        ? 'Saranno eliminati partite, risultati e voti MVP. Squadre, nomi e roster resteranno invariati.'
        : 'Saranno eliminati gironi, partite, risultati, voti MVP, squadre e assegnazioni. I 48 partecipanti resteranno registrati.',
      confirmLabel: resetCalendar ? 'Resetta calendario' : 'Resetta tutto',
      tone: 'danger',
    })

    if (!confirmed) return

    await runOperation(
      '/api/admin-reset-draw',
      'DELETE',
      { action },
    )
  }

  async function handleSaveName(event) {
    event.preventDefault()

    if (!editingId || !canRename || disabled) return

    const saved = await runOperation(
      '/api/admin-teams',
      'PATCH',
      { id: editingId, name: teamName },
    )

    if (saved) {
      setEditingId(null)
      setTeamName('')
    }
  }

  function getTeamName(teamId) {
    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? teamId
    )
  }

  return (
    <section>
      <Link to="/admin">← Amministrazione</Link>

      <h2>Sorteggio squadre e calendario</h2>

      <p>
        Stato torneo: <strong>{tournament.status}</strong>
      </p>

      <p>
        Partecipanti: <strong>{players.length} / 48</strong>
      </p>

      {!hasTeams && (
        <>
          <p>
            Verranno create 6 squadre da 8 partecipanti.
            Rimo Filomena e Nuzzo Manuela saranno
            nella stessa squadra.
          </p>

          <Link to="/admin/partecipanti">
            Gestisci partecipanti
          </Link>

          {players.length !== 48 && (
            <p>Servono tutti i 48 partecipanti.</p>
          )}

          <p>
            <button
              type="button"
              disabled={!canDraw || disabled}
              onClick={handleDraw}
            >
              Sorteggia squadre
            </button>
          </p>
        </>
      )}

      {error && <p role="alert">{error}</p>}

      {hasTeams && (
        <>
          <h3>Squadre salvate</h3>

          {tournament.teams.map((team) => (
            <article key={team.id}>
              <h4>{team.name}</h4>

              {canRename && (
                editingId === team.id ? (
                  <form onSubmit={handleSaveName}>
                    <label>
                      Nome squadra
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        value={teamName}
                        disabled={disabled}
                        onChange={(event) =>
                          setTeamName(event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={disabled}
                    >
                      Salva nome
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setEditingId(null)
                        setTeamName('')
                      }}
                    >
                      Annulla
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setEditingId(team.id)
                      setTeamName(team.name)
                      setError('')
                    }}
                  >
                    Modifica nome squadra
                  </button>
                )
              )}

              <ul>
                {[...team.players]
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, 'it'),
                  )
                  .map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
              </ul>
            </article>
          ))}

          {!hasCalendar && (
            <div>
              <h3>Calendario</h3>

              <p>
                Il sorteggio assegna le squadre a due
                gironi da tre e crea le 10 partite.
                Prima di procedere salva i nomi delle squadre.
              </p>

              <button
                type="button"
                disabled={
                  !canCreateCalendar ||
                  disabled ||
                  Boolean(editingId)
                }
                onClick={handleCalendar}
              >
                Sorteggia gironi e calendario
              </button>
            </div>
          )}

          {tournament.groups.map((group) => (
            <article key={group.id}>
              <h3>{group.name}</h3>

              <ul>
                {group.teamIds.map((teamId) => (
                  <li key={teamId}>
                    {getTeamName(teamId)}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <section className="draw-reset-panel">
            <div>
              <p>Zona di ripristino</p>
              <h3>Reset sorteggi</h3>
              <span>
                Disponibile solo prima dell’inizio delle partite e senza voti MVP.
              </span>
            </div>
            <div className="draw-reset-actions">
              {hasCalendar && (
                <button
                  type="button"
                  disabled={disabled || Boolean(editingId)}
                  onClick={() => handleReset('calendar')}
                >
                  Resetta gironi e calendario
                </button>
              )}
              <button
                className="draw-reset-all"
                type="button"
                disabled={disabled || Boolean(editingId)}
                onClick={() => handleReset('teams')}
              >
                Resetta tutto il sorteggio
              </button>
            </div>
          </section>

          {hasCalendar && (
            <p>
              Calendario salvato: {tournament.matches.length}
              {' '}partite.{' '}
              <Link to="/admin/partite">
                Gestisci partite
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  )
}