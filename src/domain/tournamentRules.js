export const TOURNAMENT_RULES = {
  teamsCount: 6,
  playersPerTeam: 8,
  groupsCount: 2,
  teamsPerGroup: 3,

  setTarget: 15,
  setWinBy: 2,
  setsToWinMatch: 2,

  standingsPoints: {
    win2_0: 3,
    win2_1: 2,
    loss1_2: 1,
    loss0_2: 0,
  },
}

export function isSetWon(teamAScore, teamBScore) {
  const maxScore = Math.max(teamAScore, teamBScore)
  const difference = Math.abs(teamAScore - teamBScore)

  return (
    maxScore >= TOURNAMENT_RULES.setTarget &&
    difference >= TOURNAMENT_RULES.setWinBy
  )
}

export function getSetWinner(teamAScore, teamBScore) {
  if (!isSetWon(teamAScore, teamBScore)) {
    return null
  }

  return teamAScore > teamBScore ? 'A' : 'B'
}

export function getMatchScore(sets = []) {
  return sets.reduce(
    (score, set) => {
      const winner = getSetWinner(set.teamAScore, set.teamBScore)

      if (winner === 'A') score.teamA += 1
      if (winner === 'B') score.teamB += 1

      return score
    },
    {
      teamA: 0,
      teamB: 0,
    },
  )
}

export function isMatchCompleted(sets = []) {
  const score = getMatchScore(sets)

  return (
    score.teamA === TOURNAMENT_RULES.setsToWinMatch ||
    score.teamB === TOURNAMENT_RULES.setsToWinMatch
  )
}

export function getStandingsPoints(sets = []) {
  if (!isMatchCompleted(sets)) {
    return null
  }

  const score = getMatchScore(sets)

  if (score.teamA === 2 && score.teamB === 0) {
    return {
      teamA: 3,
      teamB: 0,
    }
  }

  if (score.teamA === 2 && score.teamB === 1) {
    return {
      teamA: 2,
      teamB: 1,
    }
  }

  if (score.teamA === 1 && score.teamB === 2) {
    return {
      teamA: 1,
      teamB: 2,
    }
  }

  if (score.teamA === 0 && score.teamB === 2) {
    return {
      teamA: 0,
      teamB: 3,
    }
  }

  return null
}