import { useTournament } from '../state/TournamentContext'

export default function Home() {
  const { tournament } = useTournament()

  return (
    <section>
      <h2>{tournament.name}</h2>

      <HomeContent status={tournament.status} />
    </section>
  )
}

function HomeContent({ status }) {
  switch (status) {
    case 'setup':
      return (
        <p>
          Il torneo non è ancora iniziato.
        </p>
      )

    case 'draw':
      return (
        <p>
          Sorteggio delle squadre e dei gironi in corso.
        </p>
      )

    case 'group_stage':
      return (
        <p>
          Fase a gironi in corso.
        </p>
      )

    case 'semifinals':
      return (
        <p>
          Semifinali in corso.
        </p>
      )

    case 'finals':
      return (
        <p>
          Fase finale del torneo.
        </p>
      )

    case 'completed':
      return (
        <p>
          Torneo concluso.
        </p>
      )

    default:
      return null
  }
}