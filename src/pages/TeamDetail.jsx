import { motion } from 'motion/react'
import { Link, useParams } from 'react-router-dom'

import { getMatchScore } from '../domain/tournamentRules'
import { useTournament } from '../state/TournamentContext'

const PHASE_LABELS = {
  group: 'Fase a gironi',
  semifinal: 'Semifinale',
  placement_5_6: '5°/6° posto',
  final: 'Finale',
}

const PHASE_ORDER = {
  group: 1,
  semifinal: 2,
  placement_5_6: 3,
  final: 4,
}

const MotionDiv = motion.div
const MotionArticle = motion.article

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function TeamDetail() {
  const { id } = useParams()
  const { tournament } = useTournament()

  const team = tournament.teams.find(
    (item) => item.id === id,
  )

  if (!team) {
    return (
      <section>
        <Link to="/squadre">← Squadre</Link>

        <h2>Squadra non trovata</h2>

        <p>
          La squadra potrebbe non essere ancora stata
          creata oppure il collegamento non è più valido.
        </p>
      </section>
    )
  }

  const players = [...team.players].sort((a, b) =>
    a.name.localeCompare(b.name, 'it'),
  )

  const teamMatches = tournament.matches.filter(
    (match) =>
      match.teamAId === team.id ||
      match.teamBId === team.id,
  )

  function compareMatches(a, b) {
    if (a.status === 'live' && b.status !== 'live') return -1
    if (b.status === 'live' && a.status !== 'live') return 1

    if (a.scheduledAt && b.scheduledAt) {
      const difference =
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime()

      if (difference !== 0) return difference
    }

    return (
      (PHASE_ORDER[a.phase] ?? 99) -
        (PHASE_ORDER[b.phase] ?? 99) ||
      a.id.localeCompare(b.id)
    )
  }

  const upcomingMatches = teamMatches
    .filter((match) => match.status !== 'completed')
    .sort(compareMatches)

  const completedMatches = teamMatches
    .filter((match) => match.status === 'completed')
    .sort(compareMatches)

  const wins = completedMatches.filter((match) => {
    const score = getMatchScore(match.sets)
    return match.teamAId === team.id
      ? score.teamA > score.teamB
      : score.teamB > score.teamA
  }).length

  const losses = completedMatches.length - wins

  function renderMatch(match) {
    const isTeamA = match.teamAId === team.id

    const opponentId = isTeamA
      ? match.teamBId
      : match.teamAId

    const opponent = tournament.teams.find(
      (item) => item.id === opponentId,
    )

    const score = getMatchScore(match.sets)

    // Il risultato viene mostrato dal punto di vista
    // della squadra di cui si sta consultando il dettaglio.
    const ownScore = isTeamA ? score.teamA : score.teamB
    const opponentScore = isTeamA ? score.teamB : score.teamA

    const completed = match.status === 'completed'
    const live =
      match.status === 'live' ||
      tournament.liveMatchId === match.id

    const setResults = match.sets.map((set) =>
      isTeamA
        ? [set.teamAScore, set.teamBScore]
        : [set.teamBScore, set.teamAScore],
    )

    return (
      <MotionArticle
        className={`team-match-card${live ? ' is-live' : ''}`}
        key={match.id}
        variants={cardVariants}
        whileHover={{ y: -4, transition: { duration: 0.18 } }}
      >
        <div className="team-match-card-topline">
          <span>{PHASE_LABELS[match.phase] ?? match.phase}</span>
          <span className={`team-match-status${live ? ' is-live' : ''}`}>
            {completed ? 'Conclusa' : live ? 'In corso' : 'Da giocare'}
          </span>
        </div>
        <h4>
          <span>{team.name}</span>
          <span className="team-match-versus">vs</span>
          {opponent ? (
            <Link to={`/squadre/${opponent.id}`}>{opponent.name}</Link>
          ) : (
            <span>Avversaria da definire</span>
          )}
        </h4>

        {(completed || match.sets.length > 0) ? (
          <div className="team-match-result">
            <div>
              <strong>{ownScore}</strong>
              <span>Set</span>
              <strong>{opponentScore}</strong>
            </div>
            {completed && (
              <span className={`team-match-outcome${ownScore > opponentScore ? ' is-win' : ''}`}>
                {ownScore > opponentScore ? 'Vittoria' : 'Sconfitta'}
              </span>
            )}
          </div>
        ) : (
          <p className="team-match-pending">Risultato non ancora disponibile</p>
        )}

        {setResults.length > 0 && (
          <div className="team-match-sets" aria-label="Punti per set, squadra vista per prima">
            {setResults.map(([ownPoints, rivalPoints], index) => (
              <span key={index}>S{index + 1} <strong>{ownPoints}:{rivalPoints}</strong></span>
            ))}
          </div>
        )}

        {match.scheduledAt && (
          <p className="team-match-time">
            {new Date(match.scheduledAt).toLocaleString('it-IT', {
              timeZone: 'Europe/Rome',
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        )}

        <Link className="team-match-link" to={`/partita/${match.id}`}>
          Match center <span aria-hidden="true">↗</span>
        </Link>
      </MotionArticle>
    )
  }

  return (
    <section className="team-detail-page">
      <Link className="team-detail-back" to="/squadre">
        <span aria-hidden="true">←</span> Tutte le squadre
      </Link>

      <MotionDiv
        className="team-detail-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="team-detail-hero-copy">
          <p className="team-detail-eyebrow">
            {team.groupId ? `Girone ${team.groupId}` : 'Memorial Alessio Rizzo'}
          </p>
          <h2>{team.name}</h2>
          <p className="team-detail-caption">La formazione · Il roster · Il percorso</p>
        </div>
        <div className="team-detail-player-count">
          <strong>{String(players.length).padStart(2, '0')}</strong>
          <span>Atlete</span>
        </div>
        <span className="team-detail-court" aria-hidden="true" />
      </MotionDiv>

      <div className="team-detail-stats" aria-label="Statistiche squadra">
        <div><strong>{team.groupId ?? '—'}</strong><span>Girone</span></div>
        <div><strong>{completedMatches.length}</strong><span>Partite giocate</span></div>
        <div><strong>{wins}</strong><span>Vittorie</span></div>
        <div><strong>{losses}</strong><span>Sconfitte</span></div>
      </div>

      <section className="team-roster-section">
        <div className="team-section-heading">
          <div>
            <p>La formazione</p>
            <h3>Roster</h3>
          </div>
          <span>{players.length} giocatrici</span>
        </div>

        {players.length === 0 ? (
          <div className="team-detail-empty">Nessuna giocatrice assegnata.</div>
        ) : (
          <MotionDiv
            className="team-roster-grid"
            variants={staggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {players.map((player, index) => (
              <MotionDiv
                className="team-player-card"
                key={player.id}
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.16 } }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{player.name}</strong>
              </MotionDiv>
            ))}
          </MotionDiv>
        )}
      </section>

      <section className="team-matches-section">
        <div className="team-section-heading">
          <div>
            <p>Il cammino nel torneo</p>
            <h3>Partite</h3>
          </div>
          <Link to="/partite">Calendario completo <span aria-hidden="true">↗</span></Link>
        </div>

        {tournament.matches.length === 0 ? (
          <div className="team-detail-empty">Il calendario non è ancora stato sorteggiato.</div>
        ) : upcomingMatches.length === 0 && completedMatches.length === 0 ? (
          <div className="team-detail-empty">Nessuna partita assegnata a questa squadra.</div>
        ) : (
          <>
            {upcomingMatches.length > 0 && (
              <>
                <h4 className="team-match-group-label">In programma</h4>
                <MotionDiv
                  className="team-matches-grid"
                  variants={staggerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                >
                  {upcomingMatches.map(renderMatch)}
                </MotionDiv>
              </>
            )}

            {completedMatches.length > 0 && (
              <>
                <h4 className="team-match-group-label">Risultati</h4>
                <MotionDiv
                  className="team-matches-grid"
                  variants={staggerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                >
                  {completedMatches.map(renderMatch)}
                </MotionDiv>
              </>
            )}
          </>
        )}
      </section>
    </section>
  )
}