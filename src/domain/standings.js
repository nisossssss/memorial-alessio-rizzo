import { getWinnerTeamId } from './advancement'
import {
  getMatchScore,
  getStandingsPoints,
} from './tournamentRules'

export function buildGroupStandings(teamIds, matches) {
  const standings = teamIds.map((teamId) => ({
    teamId,
    played: 0,
    wins: 0,
    losses: 0,
    points: 0,
    setsWon: 0,
    setsLost: 0,
    pointsScored: 0,
    pointsConceded: 0,
  }))

  const byTeamId = new Map(
    standings.map((entry) => [entry.teamId, entry]),
  )

  matches
    .filter((match) => match.status === 'completed')
    .forEach((match) => {
      const teamA = byTeamId.get(match.teamAId)
      const teamB = byTeamId.get(match.teamBId)

      if (!teamA || !teamB) {
        return
      }

      const matchScore = getMatchScore(match.sets)
      const standingsPoints = getStandingsPoints(match.sets)

      if (!standingsPoints) {
        return
      }

      teamA.played += 1
      teamB.played += 1

      teamA.setsWon += matchScore.teamA
      teamA.setsLost += matchScore.teamB

      teamB.setsWon += matchScore.teamB
      teamB.setsLost += matchScore.teamA

      teamA.points += standingsPoints.teamA
      teamB.points += standingsPoints.teamB

      if (matchScore.teamA > matchScore.teamB) {
        teamA.wins += 1
        teamB.losses += 1
      } else {
        teamB.wins += 1
        teamA.losses += 1
      }

      match.sets.forEach((set) => {
        teamA.pointsScored += set.teamAScore
        teamA.pointsConceded += set.teamBScore

        teamB.pointsScored += set.teamBScore
        teamB.pointsConceded += set.teamAScore
      })
    })

  return standings.sort(compareStandings)
}

function compareStandings(a, b) {
  // 1. Più punti in classifica
  if (b.points !== a.points) {
    return b.points - a.points
  }

  // 2. Più set vinti
  if (b.setsWon !== a.setsWon) {
    return b.setsWon - a.setsWon
  }

  // 3. Meno punti subiti
  if (a.pointsConceded !== b.pointsConceded) {
    return a.pointsConceded - b.pointsConceded
  }

  return 0
}

function getLoserTeamId(match) {
  const winnerTeamId = getWinnerTeamId(match)

  if (!winnerTeamId) {
    return null
  }

  return winnerTeamId === match.teamAId
    ? match.teamBId
    : match.teamAId
}

export function buildFinalStandings(teams, matches) {
  const final = matches.find(
    (match) => match.id === 'final',
  )

  const placement = matches.find(
    (match) => match.id === 'placement-5-6',
  )

  const semifinals = matches.filter(
    (match) => match.phase === 'semifinal',
  )

  const decisiveMatches = [
    final,
    placement,
    ...semifinals,
  ]

  // Mostra la classifica finale soltanto quando tutte
  // le partite decisive sono concluse.
  if (
    semifinals.length !== 2 ||
    decisiveMatches.some(
      (match) =>
        !match ||
        match.status !== 'completed' ||
        !getWinnerTeamId(match),
    )
  ) {
    return []
  }

  const semifinalLosers = semifinals.map(
    getLoserTeamId,
  )

  // Per il 3° e 4° posto si considerano gironi
  // e semifinali, applicando gli stessi criteri:
  // punti, set vinti, meno punti subiti.
  //
  // Le statistiche vengono calcolate su tutte le squadre
  // per includere anche gli incontri contro le finaliste.
  const thirdAndFourth = buildGroupStandings(
    teams.map((team) => team.id),
    matches.filter(
      (match) =>
        match.phase === 'group' ||
        match.phase === 'semifinal',
    ),
  ).filter((entry) =>
    semifinalLosers.includes(entry.teamId),
  )

  const orderedTeamIds = [
    getWinnerTeamId(final),
    getLoserTeamId(final),
    ...thirdAndFourth.map((entry) => entry.teamId),
    getWinnerTeamId(placement),
    getLoserTeamId(placement),
  ]

  return orderedTeamIds.map((teamId, index) => ({
    teamId,
    position: index + 1,
  }))
}