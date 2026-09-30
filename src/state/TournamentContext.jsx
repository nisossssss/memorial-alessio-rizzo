import { createContext, useContext } from 'react'

export const TournamentContext = createContext(null)

export function useTournament() {
  const context = useContext(TournamentContext)

  if (!context) {
    throw new Error(
      'useTournament must be used inside TournamentProvider',
    )
  }

  return context
}