import { motion } from 'motion/react'
import { Link, useParams } from 'react-router-dom'

import MvpVote from '../components/MvpVote'
import { getMatchScore } from '../domain/tournamentRules'
import { useTournament } from '../state/TournamentContext'

const PHASE_LABELS = {
  group: 'Partita dei gironi',
  semifinal: 'Semifinale',
  placement_5_6: 'Partita 5°/6° posto',
  final: 'Finale',
}

const STATUS_LABELS = {
  scheduled: 'In programma',
  live: 'Partita in corso',
  completed: 'Partita conclusa',
}

const MotionDiv = motion.div
const MotionArticle = motion.article

export default function MatchDetail() {
  const { id } = useParams()
  const { tournament } = useTournament()

  const match = tournament.matches.find(
    (item) => item.id === id,
  )
  const teamA = tournament.teams.find(
    (team) => team.id === match?.teamAId,
  )
  const teamB = tournament.teams.find(
    (team) => team.id === match?.teamBId,
  )
  const score = getMatchScore(match?.sets ?? [])
  const isLive =
    match?.status === 'live' || tournament.liveMatchId === match?.id

  return (
    <section className="match-detail-page">
      <Link className="match-back-link" to="/partite">
        <span aria-hidden="true">←</span> Tutte le partite
      </Link>

      {!match ? (
        <h2>Partita non trovata</h2>
      ) : (
        <>
          <div className="match-detail-heading">
            <div>
              <p className="match-phase-label">
                {PHASE_LABELS[match.phase] ?? 'Partita'}
              </p>
              <h2>Match center</h2>
            </div>
            <span className={`match-live-badge${isLive ? ' is-live' : ''}`}>
              {isLive && <span className="match-live-dot" aria-hidden="true" />}
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
          </div>

          {match.scheduledAt && (
            <p className="match-scheduled-at">
              {new Date(match.scheduledAt).toLocaleString('it-IT', {
                timeZone: 'Europe/Rome',
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          )}

          <MotionDiv
            className="match-center-grid"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <TeamPanel team={teamA} side="a" />

            <MotionDiv
              className="match-score-panel"
              variants={{
                hidden: { opacity: 0, scale: 0.94, y: 14 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <span className="score-panel-label">Set vinti</span>
              <div className="match-set-score" aria-label={`${score.teamA} set a ${score.teamB}`}>
                <strong>{score.teamA}</strong>
                <span>:</span>
                <strong>{score.teamB}</strong>
              </div>
              <span className="score-panel-caption">Punteggio partita</span>

              <div className="match-set-list" aria-label="Punti per set">
                {match.sets.length > 0 ? (
                  match.sets.map((set, index) => (
                    <div className="match-set-row" key={index}>
                      <span>Set {String(index + 1).padStart(2, '0')}</span>
                      <strong>
                        {set.teamAScore}
                        <i>:</i>
                        {set.teamBScore}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className="match-no-sets">I set compariranno qui</p>
                )}
              </div>
            </MotionDiv>

            <TeamPanel team={teamB} side="b" />
          </MotionDiv>

          {teamA && teamB && (
            <MotionArticle
              className="mvp-vote-card"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mvp-vote-heading">
                <span className="mvp-ballot-mark" aria-hidden="true">MVP</span>
                <div>
                  <p>Il riconoscimento della partita</p>
                  <h3>Vota la giocatrice MVP</h3>
                </div>
              </div>
              <MvpVote
                key={match.id}
                match={match}
                teams={tournament.teams}
              />
            </MotionArticle>
          )}
        </>
      )}
    </section>
  )
}

function TeamPanel({ team, side }) {
  const players = [...(team?.players ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'it'),
  )

  return (
    <MotionArticle
      className={`match-team-card team-side-${side}`}
      variants={{
        hidden: { opacity: 0, x: side === 'a' ? -18 : 18 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      <div className="team-card-topline">
        <span>Squadra {side.toUpperCase()}</span>
        <span>{String(players.length).padStart(2, '0')} atlete</span>
      </div>
      <h3>{team?.name ?? 'Squadra da definire'}</h3>
      <div className="team-roster-heading">
        <span>Convocate</span>
        {team?.groupId && <span>Girone {team.groupId}</span>}
      </div>
      {players.length > 0 ? (
        <ul className="team-player-list">
          {players.map((player, index) => (
            <li key={player.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{player.name}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="team-roster-empty">Roster non disponibile</p>
      )}
    </MotionArticle>
  )
}