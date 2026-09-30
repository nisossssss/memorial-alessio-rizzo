import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { players } from '../data/players'
import { drawGroups, drawTeams } from '../domain/draw'
import {
    createGroupMatches,
    createKnockoutMatches,
} from '../domain/tournament'
import { useTournament } from '../state/TournamentContext'

export default function Draw() {
  const navigate = useNavigate()
  const { tournament, dispatch } = useTournament()

  const [previewTeams, setPreviewTeams] = useState([])
  const [previewGroups, setPreviewGroups] = useState([])

  function handleDrawTeams() {
    const teams = drawTeams(players)

    setPreviewTeams(teams)
    setPreviewGroups([])

    dispatch({
      type: 'SET_STATUS',
      payload: 'draw',
    })
  }

  function handleTeamNameChange(teamId, name) {
    setPreviewTeams((currentTeams) =>
      currentTeams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              name,
            }
          : team,
      ),
    )
  }

  function handleDrawGroups() {
    if (previewTeams.length !== 6) {
      return
    }

    const allTeamsHaveName = previewTeams.every(
      (team) => team.name.trim().length > 0,
    )

    if (!allTeamsHaveName) {
      return
    }

    const result = drawGroups(previewTeams)

    setPreviewTeams(result.teams)
    setPreviewGroups(result.groups)
  }

  function handleConfirmTournament() {
    if (
      previewTeams.length !== 6 ||
      previewGroups.length !== 2
    ) {
      return
    }

    const groupMatches = createGroupMatches(previewGroups)
    const knockoutMatches = createKnockoutMatches()

    dispatch({
      type: 'SET_TEAMS',
      payload: previewTeams,
    })

    dispatch({
      type: 'SET_GROUPS',
      payload: previewGroups,
    })

    dispatch({
      type: 'SET_MATCHES',
      payload: [
        ...groupMatches,
        ...knockoutMatches,
      ],
    })

    dispatch({
      type: 'SET_STATUS',
      payload: 'group_stage',
    })

    navigate('/gironi')
  }

  const canDrawGroups =
    previewTeams.length === 6 &&
    previewTeams.every(
      (team) => team.name.trim().length > 0,
    )

  const canStartTournament =
    previewTeams.length === 6 &&
    previewGroups.length === 2

  return (
    <section>
      <h2>Sorteggio</h2>

      <p>
        Stato torneo: {tournament.status}
      </p>

      {previewTeams.length === 0 && (
        <button onClick={handleDrawTeams}>
          Sorteggia squadre
        </button>
      )}

      {previewTeams.length > 0 && (
        <>
          <h3>Squadre sorteggiate</h3>

          {previewTeams.map((team, index) => (
            <div key={team.id}>
              <h4>Squadra {index + 1}</h4>

              <input
                type="text"
                placeholder="Nome squadra"
                value={team.name}
                onChange={(event) =>
                  handleTeamNameChange(
                    team.id,
                    event.target.value,
                  )
                }
              />

              <ul>
                {team.players.map((player) => (
                  <li key={player.id}>
                    {player.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {previewGroups.length === 0 && (
            <button
              onClick={handleDrawGroups}
              disabled={!canDrawGroups}
            >
              Sorteggia gironi
            </button>
          )}
        </>
      )}

      {previewGroups.length > 0 && (
        <>
          <h3>Gironi sorteggiati</h3>

          {previewGroups.map((group) => (
            <div key={group.id}>
              <h4>{group.name}</h4>

              <ul>
                {group.teamIds.map((teamId) => {
                  const team = previewTeams.find(
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

          <button
            onClick={handleConfirmTournament}
            disabled={!canStartTournament}
          >
            Avvia torneo
          </button>
        </>
      )}
    </section>
  )
}