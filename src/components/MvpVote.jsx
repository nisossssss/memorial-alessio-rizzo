import { useEffect, useState } from 'react'

export default function MvpVote({ match, teams }) {
  const [vote, setVote] = useState(null)
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setVote(null)
    setError('')
    setLoading(true)

    async function loadVote() {
      try {
        const response = await fetch(
          `/api/mvp-vote?matchId=${encodeURIComponent(match.id)}`,
          {
            credentials: 'same-origin',
            cache: 'no-store',
            signal: controller.signal,
          },
        )

        const result = await readJsonResponse(response)

        if (!response.ok) {
          throw new Error(result.error ?? 'Votazione non disponibile.')
        }

        if (!controller.signal.aborted) {
          setVote(result)
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadVote()

    return () => controller.abort()
  }, [match.id, match.status, attempt])

  const participatingTeams = teams.filter(
    (team) =>
      team.id === match.teamAId ||
      team.id === match.teamBId,
  )

  async function handleVote(event) {
    event.preventDefault()

    if (busy || !selected || vote?.voted) return

    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/mvp-vote', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Mvp-Request': '1',
        },
        body: JSON.stringify({
          matchId: match.id,
          playerId: selected,
        }),
      })

      const result = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(result.error ?? 'Voto non registrato.')
      }

      setVote({
        open: true,
        voted: true,
        playerId: result.playerId,
      })
    } catch (voteError) {
      setError(voteError.message)
    } finally {
      setBusy(false)
    }
  }

  const open = match.status === 'live' && vote?.open
  const hasPlayers = participatingTeams.some(
    (team) => team.players.length > 0,
  )

  return (
    <section className="mvp-vote-control">
      {vote?.voted ? (
        <p role="status">
          Voto registrato. Grazie per aver partecipato!
        </p>
      ) : loading && !error ? (
        <p role="status">Verifica disponibilità votazione…</p>
      ) : open && hasPlayers ? (
        <form onSubmit={handleVote}>
          <label>
            Scegli il giocatore
            <select
              required
              value={selected}
              disabled={busy}
              onChange={(event) =>
                setSelected(event.target.value)
              }
            >
              <option value="">Seleziona un giocatore</option>

              {participatingTeams.map((team) => (
                <optgroup key={team.id} label={team.name}>
                  {[...team.players]
                    .sort((a, b) =>
                      a.name.localeCompare(b.name, 'it'),
                    )
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={busy || !selected}
          >
            {busy ? 'Invio voto…' : 'Invia voto'}
          </button>

          <p>Il voto è definitivo. È consentito un voto per browser per partita.</p>
        </form>
      ) : open ? (
        <p role="alert">
          Il roster delle squadre non contiene giocatrici votabili.
          Aggiorna i dati o riprova più tardi.
        </p>
      ) : match.status === 'completed' ? (
        <p>La votazione è conclusa.</p>
      ) : match.status === 'scheduled' ? (
        <p>La votazione si aprirà quando inizierà la partita.</p>
      ) : null}

      {!vote?.voted &&
        !loading &&
        match.status === 'live' &&
        vote &&
        !vote.open && (
        <p role="status">
          Il server non ha ancora aperto la votazione per questa partita.
          <button
            type="button"
            disabled={busy}
            onClick={() => setAttempt((current) => current + 1)}
          >
            Aggiorna stato
          </button>
        </p>
      )}

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => setAttempt((current) => current + 1)}
          >
            Aggiorna votazione
          </button>
        </div>
      )}
    </section>
  )
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      'Il server della votazione non ha restituito JSON. Verifica di aver avviato il progetto con vercel dev.',
    )
  }

  try {
    return await response.json()
  } catch {
    throw new Error('Risposta della votazione non valida. Riprova.')
  }
}