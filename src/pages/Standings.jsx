import { useMemo } from 'react'

import { buildGroupStandings } from '../domain/standings'
import { useTournament } from '../state/TournamentContext'

export default function Standings() {
  const { tournament } = useTournament()

  const standingsByGroup = useMemo(() => {
    return tournament.groups.map((group) => {
      const groupMatches = tournament.matches.filter(
        (match) =>
          match.phase === 'group' &&
          match.groupId === group.id,
      )

      return {
        group,
        standings: buildGroupStandings(
          group.teamIds,
          groupMatches,
        ),
      }
    })
  }, [
    tournament.groups,
    tournament.matches,
  ])

  function getTeamName(teamId) {
    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? teamId
    )
  }

  if (tournament.groups.length === 0) {
    return (
      <section>
        <h2>Classifica</h2>
        <p>Il torneo non è ancora iniziato.</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Classifica</h2>

      {standingsByGroup.map(
        ({ group, standings }) => (
          <div key={group.id}>
            <h3>{group.name}</h3>

            <table>
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Squadra</th>
                  <th>G</th>
                  <th>V</th>
                  <th>P</th>
                  <th>SV</th>
                  <th>SP</th>
                  <th>PF</th>
                  <th>PS</th>
                  <th>PT</th>
                </tr>
              </thead>

              <tbody>
                {standings.map(
                  (entry, index) => (
                    <tr key={entry.teamId}>
                      <td>{index + 1}</td>

                      <td>
                        {getTeamName(
                          entry.teamId,
                        )}
                      </td>

                      <td>{entry.played}</td>
                      <td>{entry.wins}</td>
                      <td>{entry.losses}</td>
                      <td>{entry.setsWon}</td>
                      <td>{entry.setsLost}</td>
                      <td>{entry.pointsScored}</td>
                      <td>
                        {entry.pointsConceded}
                      </td>
                      <td>{entry.points}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ),
      )}
    </section>
  )
}