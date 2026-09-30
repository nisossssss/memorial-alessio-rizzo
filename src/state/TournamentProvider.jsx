import { useEffect, useReducer } from 'react'
import { TournamentContext } from './TournamentContext'

export const TOURNAMENT_STATUS = {
  SETUP: 'setup',
  DRAW: 'draw',
  GROUP_STAGE: 'group_stage',
  SEMIFINALS: 'semifinals',
  FINALS: 'finals',
  COMPLETED: 'completed',
}

const STORAGE_KEY =
  'memorial-alessio-rizzo-tournament'

const initialState = {
  id: 'memorial-alessio-rizzo-2026',
  name: 'Memorial Alessio Rizzo',
  edition: 2026,

  status: TOURNAMENT_STATUS.SETUP,

  teams: [],
  groups: [],
  matches: [],

  liveMatchId: null,
}

function loadInitialState() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return initialState
    }

    return JSON.parse(saved)
  } catch {
    return initialState
  }
}

function tournamentReducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      }

    case 'SET_TEAMS':
      return {
        ...state,
        teams: action.payload,
      }

    case 'SET_GROUPS':
      return {
        ...state,
        groups: action.payload,
      }

    case 'SET_MATCHES':
      return {
        ...state,
        matches: action.payload,
      }

    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map(
          (match) =>
            match.id === action.payload.id
              ? {
                  ...match,
                  ...action.payload,
                }
              : match,
        ),
      }

    case 'SET_LIVE_MATCH':
      return {
        ...state,
        liveMatchId: action.payload,
      }

    case 'RESET_TOURNAMENT':
      return {
        ...initialState,
      }

    default:
      return state
  }
}

export default function TournamentProvider({
  children,
}) {
  const [tournament, dispatch] =
    useReducer(
      tournamentReducer,
      undefined,
      loadInitialState,
    )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tournament),
    )
  }, [tournament])

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        dispatch,
      }}
    >
      {children}
    </TournamentContext.Provider>
  )
}