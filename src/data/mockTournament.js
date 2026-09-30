export const mockTeams = [
  {
    id: 'team-1',
    name: 'Squadra 1',
    players: [],
    groupId: 'A',
  },
  {
    id: 'team-2',
    name: 'Squadra 2',
    players: [],
    groupId: 'A',
  },
  {
    id: 'team-3',
    name: 'Squadra 3',
    players: [],
    groupId: 'A',
  },
  {
    id: 'team-4',
    name: 'Squadra 4',
    players: [],
    groupId: 'B',
  },
  {
    id: 'team-5',
    name: 'Squadra 5',
    players: [],
    groupId: 'B',
  },
  {
    id: 'team-6',
    name: 'Squadra 6',
    players: [],
    groupId: 'B',
  },
]

export const mockGroups = [
  {
    id: 'A',
    name: 'Girone A',
    teamIds: ['team-1', 'team-2', 'team-3'],
  },
  {
    id: 'B',
    name: 'Girone B',
    teamIds: ['team-4', 'team-5', 'team-6'],
  },
]

export const mockMatches = [
  {
    id: 'group-A-1',
    phase: 'group',
    groupId: 'A',
    teamAId: 'team-1',
    teamBId: 'team-2',
    sets: [
      { teamAScore: 15, teamBScore: 10 },
      { teamAScore: 15, teamBScore: 12 },
    ],
    status: 'completed',
  },

  {
    id: 'group-A-2',
    phase: 'group',
    groupId: 'A',
    teamAId: 'team-1',
    teamBId: 'team-3',
    sets: [
      { teamAScore: 13, teamBScore: 15 },
      { teamAScore: 15, teamBScore: 11 },
      { teamAScore: 17, teamBScore: 15 },
    ],
    status: 'completed',
  },

  {
    id: 'group-A-3',
    phase: 'group',
    groupId: 'A',
    teamAId: 'team-2',
    teamBId: 'team-3',
    sets: [
      { teamAScore: 15, teamBScore: 9 },
      { teamAScore: 12, teamBScore: 15 },
      { teamAScore: 14, teamBScore: 16 },
    ],
    status: 'completed',
  },

  {
    id: 'group-B-1',
    phase: 'group',
    groupId: 'B',
    teamAId: 'team-4',
    teamBId: 'team-5',
    sets: [
      { teamAScore: 15, teamBScore: 8 },
      { teamAScore: 15, teamBScore: 13 },
    ],
    status: 'completed',
  },

  {
    id: 'group-B-2',
    phase: 'group',
    groupId: 'B',
    teamAId: 'team-4',
    teamBId: 'team-6',
    sets: [
      { teamAScore: 11, teamBScore: 15 },
      { teamAScore: 15, teamBScore: 12 },
      { teamAScore: 16, teamBScore: 14 },
    ],
    status: 'completed',
  },

  {
    id: 'group-B-3',
    phase: 'group',
    groupId: 'B',
    teamAId: 'team-5',
    teamBId: 'team-6',
    sets: [
      { teamAScore: 15, teamBScore: 7 },
      { teamAScore: 15, teamBScore: 11 },
    ],
    status: 'completed',
  },

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