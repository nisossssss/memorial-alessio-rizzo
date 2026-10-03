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
    <header className="masthead">
      <div className="masthead-inner">
        <div className="masthead-identity">
          <p className="masthead-kicker">Memorial</p>

          <h1>Alessio Rizzo</h1>
        </div>

        <span className="status-pill">
          {statusLabels[tournament.status]}
        </span>
      </div>
    </header>
  )
}