import { Link } from 'react-router-dom'

import MatchCard from '../components/MatchCard'
import { useTournament } from '../state/TournamentContext'

export default function Semifinals() {
  const { tournament } = useTournament()

  const semifinal1 = tournament.matches.find(
    (match) => match.id === 'semifinal-1',
  )

  const semifinal2 = tournament.matches.find(
    (match) => match.id === 'semifinal-2',
  )

  const completed =
    semifinal1?.status === 'completed' &&
    semifinal2?.status === 'completed'

  return (
    <section>
      <h2>Semifinali</h2>

      <p>
        Le prime due squadre di ogni girone accedono
        alle semifinali: 1ª del girone A contro
        2ª del girone B, e 1ª del girone B contro
        2ª del girone A.
      </p>

      <MatchCard
        title="Semifinale 1"
        match={semifinal1}
        placeholderA="1ª Girone A"
        placeholderB="2ª Girone B"
      />

      <MatchCard
        title="Semifinale 2"
        match={semifinal2}
        placeholderA="1ª Girone B"
        placeholderB="2ª Girone A"
      />

      {completed && (
        <p>
          Le vincitrici accedono alla finale.{' '}
          <Link to="/finale">Vai alla finale</Link>
        </p>
      )}

      <p>
        Il 3° e 4° posto vengono assegnati alle
        perdenti delle semifinali secondo i criteri
        di classifica, senza una partita dedicata.
      </p>

      <Link to="/classifica">Vedi la classifica</Link>
    </section>
  )
}