import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import useDialogs from '../../components/ui/useDialogs'
import { useTournament } from '../../state/TournamentContext'

export default function AdminPlayers() {
  const navigate = useNavigate()
  const { confirm } = useDialogs()

  const {
    tournament,
    players,
    refreshTournament,
  } = useTournament()

  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const canEdit =
    tournament.status === 'setup' &&
    tournament.teams.length === 0

  async function sendMutation(method, body) {
    const response = await fetch('/api/admin-players', {
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
        'Risposta del server non valida. Verifica che l’API admin-players sia disponibile.',
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

  async function handleSubmit(event) {
    event.preventDefault()

    if (busy || !canEdit) return

    setBusy(true)
    setError('')

    try {
      await sendMutation(
        editingId ? 'PATCH' : 'POST',
        editingId
          ? { id: editingId, name }
          : { name },
      )

      setName('')
      setEditingId(null)
      refreshTournament()
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Operazione non riuscita.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(player) {
    if (busy || !canEdit) return

    const confirmed = await confirm({
      eyebrow: 'Rimozione partecipante',
      title: 'Eliminare questa giocatrice?',
      message: `${player.name} verrà rimossa dai partecipanti. L’operazione non può essere annullata.`,
      confirmLabel: 'Elimina giocatrice',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    setBusy(true)
    setError('')

    try {
      await sendMutation('DELETE', { id: player.id })

      if (editingId === player.id) {
        setEditingId(null)
        setName('')
      }

      refreshTournament()
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Eliminazione non riuscita.',
      )
    } finally {
      setBusy(false)
    }
  }

  function startEditing(player) {
    setEditingId(player.id)
    setName(player.name)
    setError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setName('')
    setError('')
  }

  return (
    <section>
      <Link to="/admin">← Amministrazione</Link>

      <h2>Partecipanti</h2>

      <p>
        <strong>{players.length} / 48</strong> partecipanti
        registrati.
      </p>

      {!canEdit && (
        <p>
          Le modifiche ai partecipanti sono bloccate
          dopo la creazione delle squadre o l’uscita
          dalla fase di setup.
        </p>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit}>
          <label>
            Cognome e nome
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="off"
              placeholder="Inserisci qui"
              value={name}
              disabled={busy}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </label>

          <p>
            Inserisci prima il cognome, poi il nome.
          </p>

          <button
            type="submit"
            disabled={
              busy ||
              (!editingId && players.length >= 48)
            }
          >
            {busy
              ? 'Salvataggio…'
              : editingId
                ? 'Salva modifica'
                : 'Aggiungi partecipante'}
          </button>

          {editingId && (
            <button
              type="button"
              disabled={busy}
              onClick={cancelEditing}
            >
              Annulla
            </button>
          )}
        </form>
      )}

      {error && <p role="alert">{error}</p>}

      {players.length === 0 ? (
        <p>Nessun partecipante inserito.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>N.</th>
              <th>Cognome e nome</th>
              {canEdit && <th>Azioni</th>}
            </tr>
          </thead>

          <tbody>
            {players.map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>

                {canEdit && (
                  <td>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEditing(player)}
                    >
                      Modifica
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(player)}
                    >
                      Elimina
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}