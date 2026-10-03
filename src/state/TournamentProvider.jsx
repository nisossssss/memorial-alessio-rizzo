import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import useDialogs from '../components/ui/useDialogs'
import { TournamentContext } from './TournamentContext'

export const TOURNAMENT_STATUS = {
  SETUP: 'setup',
  DRAW: 'draw',
  GROUP_STAGE: 'group_stage',
  SEMIFINALS: 'semifinals',
  FINALS: 'finals',
  COMPLETED: 'completed',
}

const REFRESH_INTERVAL = 10_000

export default function TournamentProvider({ children }) {
  const { alert } = useDialogs()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [drawRevealId, setDrawRevealId] = useState(0)
  const lastTournamentStatusRef = useRef(null)

  const refreshTournament = useCallback(() => {
    setRefreshing(true)
    setAttempt((current) => current + 1)
  }, [])

  useEffect(() => {
    let active = true
    let inFlight = false
    let timer = null
    let controller = null

    function scheduleNextRefresh() {
      clearTimeout(timer)

      if (active && !document.hidden) {
        timer = setTimeout(
          () => loadTournament(false),
          REFRESH_INTERVAL,
        )
      }
    }

    async function loadTournament(manual) {
      if (!active || inFlight) return

      inFlight = true
      clearTimeout(timer)
      controller = new AbortController()

      // Evita richieste che rimangono sospese indefinitamente.
      const timeout = setTimeout(
        () => controller.abort(),
        20_000,
      )

      if (manual) {
        setRefreshing(true)
      }

      try {
        const response = await fetch('/api/tournament', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        })

        const contentType =
          response.headers.get('content-type') ?? ''

        if (!contentType.includes('application/json')) {
          throw new Error(
            'Il server non ha restituito JSON. Verifica di aver avviato il progetto con vercel dev.',
          )
        }

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error ?? 'Impossibile caricare il torneo.',
          )
        }

        if (
          !result.tournament ||
          !Array.isArray(result.tournament.teams) ||
          !Array.isArray(result.tournament.groups) ||
          !Array.isArray(result.tournament.matches) ||
          !Array.isArray(result.players)
        ) {
          throw new Error(
            'La risposta del server contiene dati non validi.',
          )
        }

        if (!active) return

        if (
          lastTournamentStatusRef.current === 'setup' &&
          result.tournament.status === 'draw'
        ) {
          setDrawRevealId((current) => current + 1)
        }

        lastTournamentStatusRef.current = result.tournament.status

        const nextData = {
          tournament: result.tournament,
          players: result.players,
        }

        // Conserva gli stessi oggetti se i dati non cambiano.
        setData((current) =>
          JSON.stringify(current) === JSON.stringify(nextData)
            ? current
            : nextData,
        )

        setError(null)
        setLastUpdatedAt(new Date().toISOString())
      } catch (loadError) {
        if (!active) return

        setError(
          loadError.name === 'AbortError'
            ? 'Il server non ha risposto in tempo.'
            : loadError instanceof Error
              ? loadError.message
              : 'Impossibile aggiornare il torneo.',
        )
      } finally {
        clearTimeout(timeout)
        inFlight = false

        if (active) {
          setLoading(false)
          setRefreshing(false)
          scheduleNextRefresh()
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearTimeout(timer)
      } else {
        loadTournament(false)
      }
    }

    function handleOnline() {
      if (!document.hidden) {
        loadTournament(false)
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    window.addEventListener('online', handleOnline)

    loadTournament(true)

    return () => {
      active = false
      clearTimeout(timer)
      controller?.abort()

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      window.removeEventListener('online', handleOnline)
    }
  }, [attempt])

  const dispatch = useCallback(() => {
    alert({
      eyebrow: 'Operazione non disponibile',
      title: 'Azione non collegata',
      message: 'Questa operazione deve essere collegata a un’API server prima di poter salvare i dati.',
      confirmLabel: 'Ho capito',
    })
  }, [alert])

  if (!data) {
    if (loading || refreshing) {
      return (
        <main aria-busy="true">
          <p role="status">Caricamento del torneo…</p>
        </main>
      )
    }

    return (
      <main>
        <h1>Impossibile caricare il torneo</h1>

        <p role="alert">
          {error ?? 'Dati del torneo non disponibili.'}
        </p>

        <button
          type="button"
          onClick={refreshTournament}
        >
          Riprova
        </button>
      </main>
    )
  }

  return (
    <TournamentContext.Provider
      value={{
        tournament: data.tournament,
        players: data.players,
        dispatch,
        refreshTournament,
        loading,
        refreshing,
        error,
        lastUpdatedAt,
        drawRevealId,
        readOnly: true,
      }}
    >
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 1000,
          padding: refreshing ? '8px 12px' : 0,
          borderRadius: 8,
          background: refreshing ? '#222' : 'transparent',
          color: '#fff',
          pointerEvents: 'none',
        }}
      >
        {refreshing ? 'Aggiornamento dati…' : ''}
      </div>

      {error && (
        <div role="alert">
          <p>
            Aggiornamento non riuscito: {error}
            {' '}Sono visibili gli ultimi dati caricati.
          </p>

          <button
            type="button"
            disabled={refreshing}
            onClick={refreshTournament}
          >
            Riprova aggiornamento
          </button>
        </div>
      )}

      {children}
    </TournamentContext.Provider>
  )
}