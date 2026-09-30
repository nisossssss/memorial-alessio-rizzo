import { Link } from 'react-router-dom'
import { useTournament } from '../state/TournamentContext'

export default function Matches() {
  const { tournament } = useTournament()

  const groupMatches = tournament.matches.filter(
    (match) => match.phase === 'group',
  )

  const semifinals = tournament.matches.filter(
    (match) => match.phase === 'semifinal',
  )

  const placementMatches = tournament.matches.filter(
    (match) => match.phase === 'placement_5_6',
  )

  const finals = tournament.matches.filter(
    (match) => match.phase === 'final',
  )

  function getTeamName(teamId) {
    if (!teamId) {
      return 'Da definire'
    }

    const team = tournament.teams.find(
      (item) => item.id === teamId,
    )

    return team?.name ?? teamId
  }

  function getMatchResult(match) {
    if (!match.sets?.length) {
      return null
    }

    let teamASets = 0
    let teamBSets = 0

    match.sets.forEach((set) => {
      if (set.teamAScore > set.teamBScore) {
        teamASets += 1
      } else if (set.teamBScore > set.teamAScore) {
        teamBSets += 1
      }
    })

    return `${teamASets} - ${teamBSets}`
  }

  function renderMatch(match) {
    const result = getMatchResult(match)

    return (
      <li key={match.id}>
        <Link to={`/partita/${match.id}`}>
          <strong>{getTeamName(match.teamAId)}</strong>
          {' vs '}
          <strong>{getTeamName(match.teamBId)}</strong>

          {result && (
            <>
              {' — '}
              {result}
            </>
          )}

          {' — '}
          {match.status}
        </Link>
      </li>
    )
  }

  return (
    <section>
      <h2>Partite</h2>

      {tournament.matches.length === 0 ? (
        <p>
          Il calendario non è ancora stato generato.
        </p>
      ) : (
        <>
          <section>
            <h3>Fase a gironi</h3>

            <h4>Girone A</h4>
            <ul>
              {groupMatches
                .filter((match) => match.groupId === 'A')
                .map(renderMatch)}
            </ul>

            <h4>Girone B</h4>
            <ul>
              {groupMatches
                .filter((match) => match.groupId === 'B')
                .map(renderMatch)}
            </ul>
          </section>

          <section>
            <h3>Semifinali</h3>

            <ul>
              {semifinals.map(renderMatch)}
            </ul>
          </section>

          <section>
            <h3>5° / 6° posto</h3>

            <ul>
              {placementMatches.map(renderMatch)}
            </ul>
          </section>

          <section>
            <h3>Finale</h3>

            <ul>
              {finals.map(renderMatch)}
            </ul>
          </section>
        </>
      )}
    </section>
  )
}