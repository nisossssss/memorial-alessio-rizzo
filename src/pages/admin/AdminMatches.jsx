import { Link } from 'react-router-dom'
import { useTournament } from '../../state/TournamentContext'

export default function AdminMatches() {
  const { tournament } = useTournament()

  function getTeamName(teamId) {
    if (!teamId) {
      return 'Da definire'
    }

    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? teamId
    )
  }

  function getMatchScore(match) {
    let teamA = 0
    let teamB = 0

    match.sets.forEach((set) => {
      if (set.teamAScore > set.teamBScore) {
        teamA += 1
      } else {
        teamB += 1
      }
    })

    return `${teamA} - ${teamB}`
  }

  if (tournament.matches.length === 0) {
    return (
      <section>
        <h2>Gestione partite</h2>
        <p>Il calendario non è ancora stato generato.</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Gestione partite</h2>

      {tournament.matches.map((match) => (
        <div key={match.id}>
          <p>
            <strong>{getTeamName(match.teamAId)}</strong>
            {' vs '}
            <strong>{getTeamName(match.teamBId)}</strong>
          </p>

          <p>
            Fase: {match.phase}
            {' — '}
            Stato: {match.status}
            {' — '}
            Risultato: {getMatchScore(match)}
          </p>

          <Link to={`/admin/partita/${match.id}`}>
            Gestisci
          </Link>

          <hr />
        </div>
      ))}
    </section>
  )
}