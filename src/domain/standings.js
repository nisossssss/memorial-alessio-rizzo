import { getMatchScore, getStandingsPoints } from './tournamentRules'

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