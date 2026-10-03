import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MvpStandings() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadStandings() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin-mvp', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (response.status === 401) {
          navigate('/admin-login', { replace: true })
          return
        }

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? 'Classifica non disponibile.')
        }

        if (!controller.signal.aborted) {
          setRows(result.standings)
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

    loadStandings()

    return () => controller.abort()
  }, [attempt, navigate])

  return (
    <section id="mvp">
      <h3>Classifica MVP — riservata admin</h3>

      <p>
        Media delle percentuali pesate.
        Gironi ×1; semifinali e 5°/6° ×1,5; finale ×2.
        Sono conteggiate solo le partite concluse con voti.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={() => setAttempt((current) => current + 1)}
      >
        {loading ? 'Caricamento…' : 'Aggiorna classifica MVP'}
      </button>

      {error && <p role="alert">{error}</p>}

      {!loading && rows.length === 0 && !error && (
        <p>Nessun partecipante presente.</p>
      )}

      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Cognome e nome</th>
              <th>Squadra</th>
              <th>Punteggio MVP</th>
              <th>Voti</th>
              <th>Partite conteggiate</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.score === null ? '—' : row.position}</td>
                <td>{row.name}</td>
                <td>{row.team_name ?? 'Non assegnata'}</td>
                <td>
                  {row.score === null
                    ? '—'
                    : `${Number(row.score).toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%`}
                </td>
                <td>{row.votes}</td>
                <td>{row.counted_matches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p>
        In parità di punteggio prevalgono i voti totali.
        Se permane la parità, la posizione è condivisa
        e l’assegnazione spetta agli organizzatori.
        Senza voti non viene assegnato un MVP.
      </p>
    </section>
  )
}