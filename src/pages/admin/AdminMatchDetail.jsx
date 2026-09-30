import { useMemo, useState } from 'react'
import {
    Link,
    useParams,
} from 'react-router-dom'

import { useTournament } from '../../state/TournamentContext'

import {
    getMatchWinner,
    validateMatch,
    validateSet,
} from '../../domain/match'

import {
    getMatchScore,
} from '../../domain/tournamentRules'

import {
    buildGroupStandings,
} from '../../domain/standings'

import {
    assignFinalists,
    assignPostGroupStageMatches,
} from '../../domain/advancement'

export default function AdminMatchDetail() {
  const { id } = useParams()

  const {
    tournament,
    dispatch,
  } = useTournament()

  const match = tournament.matches.find(
    (item) => item.id === id,
  )

  const [teamAScore, setTeamAScore] = useState('')
  const [teamBScore, setTeamBScore] = useState('')
  const [message, setMessage] = useState('')

  const teamA = useMemo(
    () =>
      tournament.teams.find(
        (team) => team.id === match?.teamAId,
      ),
    [
      tournament.teams,
      match?.teamAId,
    ],
  )

  const teamB = useMemo(
    () =>
      tournament.teams.find(
        (team) => team.id === match?.teamBId,
      ),
    [
      tournament.teams,
      match?.teamBId,
    ],
  )

  if (!match) {
    return (
      <section>
        <h2>Partita non trovata</h2>

        <Link to="/admin/partite">
          Torna alle partite
        </Link>
      </section>
    )
  }

  if (!match.teamAId || !match.teamBId) {
    return (
      <section>
        <h2>Partita non ancora definita</h2>

        <p>
          Le squadre saranno determinate automaticamente
          dall'avanzamento del torneo.
        </p>

        <Link to="/admin/partite">
          Torna alle partite
        </Link>
      </section>
    )
  }

  const matchScore = getMatchScore(match.sets)

  const isCompleted =
    match.status === 'completed'

  function handleStartMatch() {
    setMessage('')

    dispatch({
      type: 'UPDATE_MATCH',
      payload: {
        id: match.id,
        status: 'live',
      },
    })

    dispatch({
      type: 'SET_LIVE_MATCH',
      payload: match.id,
    })
  }

  function updateTournamentProgress(updatedMatches) {
    let nextMatches = updatedMatches

    const groupMatches =
      nextMatches.filter(
        (item) => item.phase === 'group',
      )

    const allGroupMatchesCompleted =
      groupMatches.length === 6 &&
      groupMatches.every(
        (item) => item.status === 'completed',
      )

    if (allGroupMatchesCompleted) {
      const groupA =
        tournament.groups.find(
          (group) => group.id === 'A',
        )

      const groupB =
        tournament.groups.find(
          (group) => group.id === 'B',
        )

      if (groupA && groupB) {
        const groupAStandings =
          buildGroupStandings(
            groupA.teamIds,
            groupMatches.filter(
              (item) => item.groupId === 'A',
            ),
          )

        const groupBStandings =
          buildGroupStandings(
            groupB.teamIds,
            groupMatches.filter(
              (item) => item.groupId === 'B',
            ),
          )

        nextMatches =
          assignPostGroupStageMatches(
            nextMatches,
            groupAStandings,
            groupBStandings,
          )

        dispatch({
          type: 'SET_STATUS',
          payload: 'semifinals',
        })
      }
    }

    const semifinals =
      nextMatches.filter(
        (item) => item.phase === 'semifinal',
      )

    const allSemifinalsCompleted =
      semifinals.length === 2 &&
      semifinals.every(
        (item) => item.status === 'completed',
      )

    if (allSemifinalsCompleted) {
      nextMatches =
        assignFinalists(nextMatches)

      dispatch({
        type: 'SET_STATUS',
        payload: 'finals',
      })
    }

    const finalMatch =
      nextMatches.find(
        (item) => item.phase === 'final',
      )

    const placementMatch =
      nextMatches.find(
        (item) =>
          item.phase === 'placement_5_6',
      )

    if (
      finalMatch?.status === 'completed' &&
      placementMatch?.status === 'completed'
    ) {
      dispatch({
        type: 'SET_STATUS',
        payload: 'completed',
      })
    }

    dispatch({
      type: 'SET_MATCHES',
      payload: nextMatches,
    })
  }

  function handleAddSet(event) {
    event.preventDefault()

    setMessage('')

    if (
      teamAScore === '' ||
      teamBScore === ''
    ) {
      setMessage(
        'Inserisci entrambi i punteggi.',
      )

      return
    }

    const parsedTeamA =
      Number(teamAScore)

    const parsedTeamB =
      Number(teamBScore)

    const validation =
      validateSet(
        parsedTeamA,
        parsedTeamB,
      )

    if (!validation.valid) {
      setMessage(
        'Punteggio non valido. Il set si chiude da 15 punti in su con almeno 2 punti di vantaggio.',
      )

      return
    }

    if (match.sets.length >= 3) {
      setMessage(
        'La partita non può avere più di 3 set.',
      )

      return
    }

    const updatedSets = [
      ...match.sets,
      {
        teamAScore: parsedTeamA,
        teamBScore: parsedTeamB,
      },
    ]

    const updatedScore =
      getMatchScore(updatedSets)

    const matchFinished =
      updatedScore.teamA === 2 ||
      updatedScore.teamB === 2

    const updatedMatch = {
      ...match,
      sets: updatedSets,
      status: matchFinished
        ? 'completed'
        : 'live',
    }

    const updatedMatches =
      tournament.matches.map(
        (item) =>
          item.id === match.id
            ? updatedMatch
            : item,
      )

    if (matchFinished) {
      updateTournamentProgress(
        updatedMatches,
      )

      dispatch({
        type: 'SET_LIVE_MATCH',
        payload: null,
      })
    } else {
      dispatch({
        type: 'SET_MATCHES',
        payload: updatedMatches,
      })
    }

    setTeamAScore('')
    setTeamBScore('')
  }

  function handleResetMatch() {
    const resetMatch = {
      ...match,
      sets: [],
      status: 'scheduled',
    }

    const updatedMatches =
      tournament.matches.map(
        (item) =>
          item.id === match.id
            ? resetMatch
            : item,
      )

    dispatch({
      type: 'SET_MATCHES',
      payload: updatedMatches,
    })

    if (
      tournament.liveMatchId ===
      match.id
    ) {
      dispatch({
        type: 'SET_LIVE_MATCH',
        payload: null,
      })
    }

    setTeamAScore('')
    setTeamBScore('')
    setMessage('')
  }

  function handleValidateMatch() {
    const validation =
      validateMatch(match.sets)

    if (validation.valid) {
      setMessage('Risultato valido.')
      return
    }

    setMessage(validation.reason)
  }

  const winner =
    isCompleted
      ? getMatchWinner(match.sets)
      : null

  return (
    <section>
      <p>
        <Link to="/admin/partite">
          ← Gestione partite
        </Link>
      </p>

      <h2>
        {teamA?.name}
        {' vs '}
        {teamB?.name}
      </h2>

      <p>
        Stato: <strong>{match.status}</strong>
      </p>

      <h3>
        {matchScore.teamA}
        {' - '}
        {matchScore.teamB}
      </h3>

      {winner && (
        <p>
          Vincitrice:{' '}
          <strong>
            {winner === 'A'
              ? teamA?.name
              : teamB?.name}
          </strong>
        </p>
      )}

      <h3>Set</h3>

      {match.sets.length === 0 ? (
        <p>Nessun set registrato.</p>
      ) : (
        <ol>
          {match.sets.map(
            (set, index) => (
              <li key={index}>
                Set {index + 1}:{' '}
                {set.teamAScore}
                {' - '}
                {set.teamBScore}
              </li>
            ),
          )}
        </ol>
      )}

      {match.status === 'scheduled' && (
        <button onClick={handleStartMatch}>
          Avvia partita
        </button>
      )}

      {!isCompleted &&
        match.status === 'live' && (
          <form onSubmit={handleAddSet}>
            <h3>Risultato set</h3>

            <label>
              {teamA?.name}

              <input
                type="number"
                min="0"
                value={teamAScore}
                onChange={(event) =>
                  setTeamAScore(
                    event.target.value,
                  )
                }
              />
            </label>

            <br />

            <label>
              {teamB?.name}

              <input
                type="number"
                min="0"
                value={teamBScore}
                onChange={(event) =>
                  setTeamBScore(
                    event.target.value,
                  )
                }
              />
            </label>

            <br />

            <button type="submit">
              Salva set
            </button>
          </form>
        )}

      {message && (
        <p>{message}</p>
      )}

      {isCompleted && (
        <button onClick={handleValidateMatch}>
          Verifica risultato
        </button>
      )}

      <hr />

      <button onClick={handleResetMatch}>
        Azzera partita
      </button>
    </section>
  )
}