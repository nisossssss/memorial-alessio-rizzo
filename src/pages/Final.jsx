import { Link } from 'react-router-dom'

import MatchCard from '../components/MatchCard'
import { getMatchScore } from '../domain/tournamentRules'
import { useTournament } from '../state/TournamentContext'

export default function Final() {
  const { tournament } = useTournament()

  const final = tournament.matches.find(
    (match) => match.id === 'final',
  )

  const placement = tournament.matches.find(
    (match) => match.id === 'placement-5-6',
  )

  let championName = null

  if (final?.status === 'completed') {
    const score = getMatchScore(final.sets)

    if (score.teamA !== score.teamB) {
      const winnerId =
        score.teamA > score.teamB
          ? final.teamAId
          : final.teamBId

      championName = tournament.teams.find(
        (team) => team.id === winnerId,
      )?.name ?? null
    }
  }

  return (
    <section>
      <h2>Finali</h2>

      {championName && (
        <div>
          <h3>Squadra vincitrice del torneo</h3>
          <p>
            <strong>{championName}</strong>
          </p>
        </div>
      )}

      <MatchCard
        title="Finale — 1° e 2° posto"
        match={final}
        placeholderA="Vincitrice semifinale 1"
        placeholderB="Vincitrice semifinale 2"
      />

      <MatchCard
        title="Partita — 5° e 6° posto"
        match={placement}
        placeholderA="3ª Girone A"
        placeholderB="3ª Girone B"
      />

      <p>
        Il 3° e 4° posto sono determinati confrontando
        i risultati delle perdenti delle semifinali:
        punti in classifica, set vinti e meno punti
        subiti nelle partite dei gironi e nelle semifinali.
      </p>

      {tournament.status === 'completed' && (
        <p>
          Il torneo è concluso.{' '}
          <Link to="/classifica">
            Vedi la classifica finale
          </Link>
        </p>
      )}

      <p>
        <Link to="/semifinali">Vedi le semifinali</Link>
        {' · '}
        <Link to="/partite">Tutte le partite</Link>
      </p>
    </section>
  )
}