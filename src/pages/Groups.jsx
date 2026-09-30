import { useTournament } from '../state/TournamentContext'

export default function Groups() {
  const { tournament } = useTournament()

  if (tournament.groups.length === 0) {
    return (
      <section>
        <h2>Gironi</h2>
        <p>
          I gironi non sono ancora stati sorteggiati.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2>Gironi</h2>

      {tournament.groups.map((group) => (
        <div key={group.id}>
          <h3>{group.name}</h3>

          <ul>
            {group.teamIds.map((teamId) => {
              const team = tournament.teams.find(
                (item) => item.id === teamId,
              )

              return (
                <li key={teamId}>
                  {team?.name ?? teamId}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}