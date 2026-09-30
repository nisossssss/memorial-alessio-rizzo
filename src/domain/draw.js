import { TOURNAMENT_RULES } from './tournamentRules';

const LINKED_PLAYERS = [
  'Rimo Filomena',
  'Nuzzo Manuela',
]

function shuffle(items) {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getLinkedPlayers(players) {
  const linkedNames = LINKED_PLAYERS.map(normalizeName)

  return players.filter((player) =>
    linkedNames.includes(normalizeName(player.name)),
  )
}

export function drawTeams(players) {
  const expectedPlayers =
    TOURNAMENT_RULES.teamsCount *
    TOURNAMENT_RULES.playersPerTeam

  if (!Array.isArray(players)) {
    throw new Error('Players must be an array')
  }

  if (players.length !== expectedPlayers) {
    throw new Error(
      `Expected ${expectedPlayers} players, received ${players.length}`,
    )
  }

  const linkedPlayers = getLinkedPlayers(players)

  if (linkedPlayers.length !== LINKED_PLAYERS.length) {
    throw new Error(
      `Linked players not found: ${LINKED_PLAYERS.join(', ')}`,
    )
  }

  const linkedPlayerIds = new Set(
    linkedPlayers.map((player) => player.id),
  )

  const otherPlayers = players.filter(
    (player) => !linkedPlayerIds.has(player.id),
  )

  const shuffledOthers = shuffle(otherPlayers)

  // La squadra che riceverà le due giocatrici vincolate
  // viene scelta casualmente tra le 6.
  const linkedTeamIndex = Math.floor(
    Math.random() * TOURNAMENT_RULES.teamsCount,
  )

  const teams = Array.from(
    { length: TOURNAMENT_RULES.teamsCount },
    (_, teamIndex) => ({
      id: `team-${teamIndex + 1}`,
      name: '',
      players: [],
      groupId: null,
    }),
  )

  teams[linkedTeamIndex].players.push(
    ...linkedPlayers,
  )

  let currentTeamIndex = 0

  for (const player of shuffledOthers) {
    while (
      teams[currentTeamIndex].players.length >=
      TOURNAMENT_RULES.playersPerTeam
    ) {
      currentTeamIndex =
        (currentTeamIndex + 1) %
        TOURNAMENT_RULES.teamsCount
    }

    teams[currentTeamIndex].players.push(player)

    currentTeamIndex =
      (currentTeamIndex + 1) %
      TOURNAMENT_RULES.teamsCount
  }

  // Mescoliamo anche l'ordine interno delle giocatrici
  // per non far apparire le due vincolate sempre affiancate.
  return teams.map((team) => ({
    ...team,
    players: shuffle(team.players),
  }))
}

export function drawGroups(teams) {
  if (
    !Array.isArray(teams) ||
    teams.length !== TOURNAMENT_RULES.teamsCount
  ) {
    throw new Error(
      `Expected ${TOURNAMENT_RULES.teamsCount} teams`,
    )
  }

  const shuffledTeams = shuffle(teams)

  const groupA = shuffledTeams.slice(0, 3)
  const groupB = shuffledTeams.slice(3, 6)

  return {
    teams: shuffledTeams.map((team) => ({
      ...team,
      groupId: groupA.some(
        (groupTeam) => groupTeam.id === team.id,
      )
        ? 'A'
        : 'B',
    })),

    groups: [
      {
        id: 'A',
        name: 'Girone A',
        teamIds: groupA.map((team) => team.id),
      },
      {
        id: 'B',
        name: 'Girone B',
        teamIds: groupB.map((team) => team.id),
      },
    ],
  }
}