import { getMatchWinner } from './match'

export function assignPostGroupStageMatches(
  matches,
  groupAStandings,
  groupBStandings,
) {
  if (
    groupAStandings.length !== 3 ||
    groupBStandings.length !== 3
  ) {
    throw new Error(
      'Each group standings must contain exactly 3 teams',
    )
  }

  const firstA = groupAStandings[0].teamId
  const secondA = groupAStandings[1].teamId
  const thirdA = groupAStandings[2].teamId

  const firstB = groupBStandings[0].teamId
  const secondB = groupBStandings[1].teamId
  const thirdB = groupBStandings[2].teamId

  return matches.map((match) => {
    if (match.id === 'semifinal-1') {
      return {
        ...match,
        teamAId: firstA,
        teamBId: secondB,
      }
    }

    if (match.id === 'semifinal-2') {
      return {
        ...match,
        teamAId: firstB,
        teamBId: secondA,
      }
    }

    if (match.id === 'placement-5-6') {
      return {
        ...match,
        teamAId: thirdA,
        teamBId: thirdB,
      }
    }

    return match
  })
}

export function assignFinalists(matches) {
  const semifinal1 = matches.find(
    (match) => match.id === 'semifinal-1',
  )

  const semifinal2 = matches.find(
    (match) => match.id === 'semifinal-2',
  )

  if (!semifinal1 || !semifinal2) {
    return matches
  }

  if (
    semifinal1.status !== 'completed' ||
    semifinal2.status !== 'completed'
  ) {
    return matches
  }

  const finalist1 = getWinnerTeamId(semifinal1)
  const finalist2 = getWinnerTeamId(semifinal2)

  if (!finalist1 || !finalist2) {
    return matches
  }

  return matches.map((match) => {
    if (match.id !== 'final') {
      return match
    }

    return {
      ...match,
      teamAId: finalist1,
      teamBId: finalist2,
    }
  })
}

export function getWinnerTeamId(match) {
  const winner = getMatchWinner(match.sets)

  if (winner === 'A') {
    return match.teamAId
  }

  if (winner === 'B') {
    return match.teamBId
  }

  return null
}