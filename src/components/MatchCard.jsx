import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { getMatchScore } from '../domain/tournamentRules'
import { useTournament } from '../state/TournamentContext'

const STATUS_LABELS = {
  scheduled: 'Da giocare',
  live: 'In corso',
  completed: 'Conclusa',
}

const MotionArticle = motion.article

export default function MatchCard({
  match,
  title,
  placeholderA = 'Da definire',
  placeholderB = 'Da definire',
}) {
  const { tournament } = useTournament()

  function getTeamName(teamId, placeholder) {
    if (!teamId) return placeholder

    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? 'Squadra da definire'
    )
  }

  if (!match) {
    return (
      <MotionArticle
        className="match-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3>{title}</h3>
        <p>Il calendario non è ancora stato generato.</p>
      </MotionArticle>
    )
  }

  const nameA = getTeamName(
    match.teamAId,
    placeholderA,
  )

  const nameB = getTeamName(
    match.teamBId,
    placeholderB,
  )

  const score = getMatchScore(match.sets)
  const ready = Boolean(match.teamAId && match.teamBId)
  const completed = match.status === 'completed'

  const live =
    match.status === 'live' ||
    tournament.liveMatchId === match.id

  const winnerName =
    completed && score.teamA !== score.teamB
      ? score.teamA > score.teamB
        ? nameA
        : nameB
      : null

  return (
    <MotionArticle
      className={`match-card${live ? ' is-live' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3>{title}</h3>

      <p>
        {live ? (
          <strong className="live-indicator">
            <span className="live-dot" aria-hidden="true" />
            In corso
          </strong>
        ) : (
          STATUS_LABELS[match.status] ?? match.status
        )}
      </p>

      <p>
        <strong>{nameA}</strong>
        {' vs '}
        <strong>{nameB}</strong>
      </p>

      {ready ? (
        <p>
          Risultato in set:{' '}
          <strong>
            {score.teamA} - {score.teamB}
          </strong>
        </p>
      ) : (
        <p>
          Le squadre saranno assegnate al termine
          della fase precedente.
        </p>
      )}

      {match.sets.length > 0 && (
        <ol aria-label="Risultati dei set">
          {match.sets.map((set, index) => (
            <li key={index}>
              Set {index + 1}: {set.teamAScore}
              {' - '}
              {set.teamBScore}
            </li>
          ))}
        </ol>
      )}

      {winnerName && (
        <p>
          Vincitrice: <strong>{winnerName}</strong>
        </p>
      )}

      {match.scheduledAt && (
        <p>
          Orario previsto:{' '}
          {new Date(match.scheduledAt).toLocaleString(
            'it-IT',
            {
              timeZone: 'Europe/Rome',
              dateStyle: 'short',
              timeStyle: 'short',
            },
          )}
        </p>
      )}

      <Link to={`/partita/${match.id}`}>
        Dettaglio partita
      </Link>
    </MotionArticle>
  )
}