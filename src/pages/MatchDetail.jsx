import { Link, useParams } from 'react-router-dom'

import { getMatchWinner } from '../domain/match'
import { getMatchScore } from '../domain/tournamentRules'
import { useTournament } from '../state/TournamentContext'

export default function MatchDetail() {
  const { id } = useParams()

  const { tournament } =
    useTournament()

  const match =
    tournament.matches.find(
      (item) => item.id === id,
    )

  if (!match) {
    return (
      <section>
        <h2>Partita non trovata</h2>

        <Link to="/partite">
          Torna alle partite
        </Link>
      </section>
    )
  }

  function getTeam(teamId) {
    return tournament.teams.find(
      (team) => team.id === teamId,
    )
  }

  const teamA =
    getTeam(match.teamAId)

  const teamB =
    getTeam(match.teamBId)

  if (!teamA || !teamB) {
    return (
      <section>
        <h2>Partita</h2>

        <p>
          Le squadre non sono ancora state determinate.
        </p>

        <Link to="/partite">
          Torna alle partite
        </Link>
      </section>
    )
  }

  const score =
    getMatchScore(match.sets)

  const winner =
    match.status === 'completed'
      ? getMatchWinner(match.sets)
      : null

  return (
    <section>
      <Link to="/partite">
        ← Partite
      </Link>

      <h2>
        {teamA.name}
        {' vs '}
        {teamB.name}
      </h2>

      <p>
        Stato: {match.status}
      </p>

      <h3>
        {score.teamA}
        {' - '}
        {score.teamB}
      </h3>

      {match.status === 'live' && (
        <p>Partita in corso</p>
      )}

      {winner && (
        <p>
          Vincitrice:{' '}
          <strong>
            {winner === 'A'
              ? teamA.name
              : teamB.name}
          </strong>
        </p>
      )}

      <h3>Set</h3>

      {match.sets.length === 0 ? (
        <p>
          La partita non è ancora iniziata.
        </p>
      ) : (
        <ol>
          {match.sets.map(
            (set, index) => (
              <li key={index}>
                Set {index + 1}:{' '}
                {set.teamAScore}
                {' - '}
                {set.teamBScore}
              </li>
            ),
          )}
        </ol>
      )}
    </section>
  )
}