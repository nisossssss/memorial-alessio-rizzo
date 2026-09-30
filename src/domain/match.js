import {
    TOURNAMENT_RULES,
    getMatchScore,
    isMatchCompleted,
    isSetWon,
} from './tournamentRules'

export function validateSet(teamAScore, teamBScore) {
  if (
    !Number.isInteger(teamAScore) ||
    !Number.isInteger(teamBScore)
  ) {
    return {
      valid: false,
      reason: 'Scores must be integers',
    }
  }

  if (teamAScore < 0 || teamBScore < 0) {
    return {
      valid: false,
      reason: 'Scores cannot be negative',
    }
  }

  if (!isSetWon(teamAScore, teamBScore)) {
    return {
      valid: false,
      reason: 'Set is not completed',
    }
  }

  return {
    valid: true,
    reason: null,
  }
}

export function validateMatch(sets = []) {
  if (!Array.isArray(sets)) {
    return {
      valid: false,
      reason: 'Sets must be an array',
    }
  }

  if (sets.length < 2 || sets.length > 3) {
    return {
      valid: false,
      reason: 'A match must contain 2 or 3 sets',
    }
  }

  for (let index = 0; index < sets.length; index += 1) {
    const set = sets[index]

    const validation = validateSet(
      set.teamAScore,
      set.teamBScore,
    )

    if (!validation.valid) {
      return {
        valid: false,
        reason: `Invalid set ${index + 1}: ${validation.reason}`,
      }
    }

    const partialSets = sets.slice(0, index + 1)

    if (
      isMatchCompleted(partialSets) &&
      index < sets.length - 1
    ) {
      return {
        valid: false,
        reason: 'Match already completed before the last set',
      }
    }
  }

  if (!isMatchCompleted(sets)) {
    return {
      valid: false,
      reason: 'Match has no winner',
    }
  }

  return {
    valid: true,
    reason: null,
  }
}

export function getMatchWinner(sets = []) {
  if (!isMatchCompleted(sets)) {
    return null
  }

  const score = getMatchScore(sets)

  return score.teamA > score.teamB ? 'A' : 'B'
}

export function getMatchLoser(sets = []) {
  const winner = getMatchWinner(sets)

  if (!winner) {
    return null
  }

  return winner === 'A' ? 'B' : 'A'
}

export function canAddSet(sets = []) {
  if (sets.length >= 3) {
    return false
  }

  if (isMatchCompleted(sets)) {
    return false
  }

  return true
}

export function getRequiredSetsToWin() {
  return TOURNAMENT_RULES.setsToWinMatch
}