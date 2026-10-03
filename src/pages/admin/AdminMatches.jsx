import { Link } from 'react-router-dom'

import { getMatchScore } from '../../domain/tournamentRules'
import { useTournament } from '../../state/TournamentContext'

const PHASE_LABELS = {
  group: 'Gironi',
  semifinal: 'Semifinale',
  placement_5_6: '5°/6° posto',
  final: 'Finale',
}

export default function AdminMatches() {
  const { tournament } = useTournament()

  function getTeamName(teamId) {
    if (!teamId) return 'Da definire'

    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? teamId
    )
  }

  return (
    <section>
      <Link to="/admin">← Amministrazione</Link>

      <h2>Gestione partite</h2>

      {tournament.matches.length === 0 ? (
        <>
          <p>Il calendario non è ancora stato generato.</p>

          <Link to="/admin/sorteggio">
            Vai al sorteggio del calendario
          </Link>
        </>
      ) : (
        tournament.matches.map((match) => {
          const score = getMatchScore(match.sets)

          return (
            <article key={match.id}>
              <p>
                <strong>{getTeamName(match.teamAId)}</strong>
                {' vs '}
                <strong>{getTeamName(match.teamBId)}</strong>
              </p>

              <p>
                Fase: {PHASE_LABELS[match.phase] ?? match.phase}
                {' — '}
                Stato: {match.status}
                {' — '}
                Risultato: {score.teamA} - {score.teamB}
              </p>

              <Link to={`/admin/partita/${match.id}`}>
                Gestisci
              </Link>

              <hr />
            </article>
          )
        })
      )}
    </section>
  )
}