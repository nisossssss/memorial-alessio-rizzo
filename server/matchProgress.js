export function getScore(sets) {
  return sets.reduce(
    (score, set) => {
      if (set.teamAScore > set.teamBScore) {
        score.teamA += 1
      } else {
        score.teamB += 1
      }

      return score
    },
    { teamA: 0, teamB: 0 },
  )
}

export function validateSet(a, b) {
  if (
    !Number.isSafeInteger(a) ||
    !Number.isSafeInteger(b) ||
    a < 0 ||
    b < 0
  ) {
    throw new Error('I punteggi devono essere interi non negativi.')
  }

  const winner = Math.max(a, b)
  const loser = Math.min(a, b)

  // Il set termina a 15, oppure ai vantaggi
  // appena viene raggiunto un distacco di 2 punti.
  const valid =
    (winner === 15 && loser <= 13) ||
    (winner > 15 && winner - loser === 2)

  if (!valid) {
    throw new Error(
      'Set non valido: esempi validi sono 15–11, 16–14 e 18–16.',
    )
  }
}

function winnerId(match) {
  const score = getScore(match.sets)

  return score.teamA > score.teamB
    ? match.team_a_id
    : match.team_b_id
}

function rankGroup(groupId, teams, matches) {
  const entries = teams
    .filter((team) => team.group_id === groupId)
    .map((team) => ({
      id: team.id,
      points: 0,
      setsWon: 0,
      conceded: 0,
    }))

  const byId = new Map(
    entries.map((entry) => [entry.id, entry]),
  )

  matches
    .filter(
      (match) =>
        match.phase === 'group' &&
        match.group_id === groupId &&
        match.status === 'completed',
    )
    .forEach((match) => {
      const a = byId.get(match.team_a_id)
      const b = byId.get(match.team_b_id)

      if (!a || !b) {
        throw new Error('Squadre del girone non valide.')
      }

      const score = getScore(match.sets)

      a.setsWon += score.teamA
      b.setsWon += score.teamB

      if (score.teamA === 2) {
        a.points += score.teamB === 0 ? 3 : 2
        b.points += score.teamB === 0 ? 0 : 1
      } else {
        b.points += score.teamA === 0 ? 3 : 2
        a.points += score.teamA === 0 ? 0 : 1
      }

      for (const set of match.sets) {
        a.conceded += set.teamBScore
        b.conceded += set.teamAScore
      }
    })

  return entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.setsWon - a.setsWon ||
      a.conceded - b.conceded ||
      a.id.localeCompare(b.id),
  )
}

export function advanceTournament(teams, matches) {
  const groups = matches.filter(
    (match) => match.phase === 'group',
  )

  if (
    groups.length !== 6 ||
    !groups.every((match) => match.status === 'completed')
  ) {
    return 'group_stage'
  }

  const groupA = rankGroup('A', teams, matches)
  const groupB = rankGroup('B', teams, matches)

  if (groupA.length !== 3 || groupB.length !== 3) {
    throw new Error('Ogni girone deve contenere 3 squadre.')
  }

  function assign(id, teamAId, teamBId) {
    const match = matches.find(
      (item) => item.public_id === id,
    )

    if (!match) {
      throw new Error('Calendario incompleto.')
    }

    if (
      match.status !== 'scheduled' &&
      (
        match.team_a_id !== teamAId ||
        match.team_b_id !== teamBId
      )
    ) {
      throw new Error(
        'Impossibile cambiare le squadre di una partita già avviata.',
      )
    }

    match.team_a_id = teamAId
    match.team_b_id = teamBId

    return match
  }

  const semi1 = assign(
    'semifinal-1',
    groupA[0].id,
    groupB[1].id,
  )

  const semi2 = assign(
    'semifinal-2',
    groupB[0].id,
    groupA[1].id,
  )

  const placement = assign(
    'placement-5-6',
    groupA[2].id,
    groupB[2].id,
  )

  if (
    semi1.status !== 'completed' ||
    semi2.status !== 'completed'
  ) {
    return 'semifinals'
  }

  const final = assign(
    'final',
    winnerId(semi1),
    winnerId(semi2),
  )

  return (
    final.status === 'completed' &&
    placement.status === 'completed'
  )
    ? 'completed'
    : 'finals'
}