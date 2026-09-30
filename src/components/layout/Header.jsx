import { useTournament } from '../../state/TournamentContext'

const statusLabels = {
  setup: 'In preparazione',
  draw: 'Sorteggio',
  group_stage: 'Fase a gironi',
  semifinals: 'Semifinali',
  finals: 'Finali',
  completed: 'Concluso',
}

export default function Header() {
  const { tournament } = useTournament()

  return (
    <header>
      <div>
        <p>Memorial</p>

        <h1>Alessio Rizzo</h1>

        <span>
          {statusLabels[tournament.status]}
        </span>
      </div>
    </header>
  )
}