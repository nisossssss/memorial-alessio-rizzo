export function createGroups(teamIds) {
  if (!Array.isArray(teamIds) || teamIds.length !== 6) {
    throw new Error('Tournament requires exactly 6 teams')
  }

  return [
    {
      id: 'A',
      name: 'Girone A',
      teamIds: teamIds.slice(0, 3),
    },
    {
      id: 'B',
      name: 'Girone B',
      teamIds: teamIds.slice(3, 6),
    },
  ]
}

export function createGroupMatches(groups) {
  return groups.flatMap((group) => {
    const [team1, team2, team3] = group.teamIds

    return [
      {
        id: `group-${group.id}-1`,
        phase: 'group',
        groupId: group.id,
        teamAId: team1,
        teamBId: team2,
        sets: [],
        status: 'scheduled',
      },
      {
        id: `group-${group.id}-2`,
        phase: 'group',
        groupId: group.id,
        teamAId: team1,
        teamBId: team3,
        sets: [],
        status: 'scheduled',
      },
      {
        id: `group-${group.id}-3`,
        phase: 'group',
        groupId: group.id,
        teamAId: team2,
        teamBId: team3,
        sets: [],
        status: 'scheduled',
      },
    ]
  })
}

export function createKnockoutMatches() {
  return [
    {
      id: 'semifinal-1',
      phase: 'semifinal',
      groupId: null,
      teamAId: null,
      teamBId: null,
      sets: [],
      status: 'scheduled',
    },
    {
      id: 'semifinal-2',
      phase: 'semifinal',
      groupId: null,
      teamAId: null,
      teamBId: null,
      sets: [],
      status: 'scheduled',
    },
    {
      id: 'placement-5-6',
      phase: 'placement_5_6',
      groupId: null,
      teamAId: null,
      teamBId: null,
      sets: [],
      status: 'scheduled',
    },
    {
      id: 'final',
      phase: 'final',
      groupId: null,
      teamAId: null,
      teamBId: null,
      sets: [],
      status: 'scheduled',
    },
  ]
}

export function createTournamentStructure(teamIds) {
  const groups = createGroups(teamIds)

  return {
    groups,
    matches: [
      ...createGroupMatches(groups),
      ...createKnockoutMatches(),
    ],
  }
}