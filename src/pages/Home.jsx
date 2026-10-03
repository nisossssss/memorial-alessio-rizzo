import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { getMatchScore } from '../domain/tournamentRules'
import { useTournament } from '../state/TournamentContext'

const MotionDiv = motion.div
const MotionArticle = motion.article

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const STATUS_LABELS = {
  setup: 'In preparazione',
  draw: 'Sorteggio',
  group_stage: 'Fase a gironi',
  semifinals: 'Semifinali',
  finals: 'Finali',
  completed: 'Concluso',
}

const PHASE_LABELS = {
  group: 'Fase a gironi',
  semifinal: 'Semifinale',
  placement_5_6: '5° / 6° posto',
  final: 'Finale',
}

export default function Home() {
  const { tournament, players } = useTournament()
  const matches = tournament.matches
  const completedMatches = matches.filter(
    (match) => match.status === 'completed',
  )
  const liveMatch = matches.find(
    (match) =>
      match.status === 'live' ||
      tournament.liveMatchId === match.id,
  )
  const nextMatch = matches.find(
    (match) => match.status === 'scheduled',
  )
  const spotlightMatch = liveMatch ?? nextMatch ?? completedMatches.at(-1)

  const metrics = [
    { label: 'Partecipanti', value: players.length, detail: 'iscritti' },
    { label: 'Squadre', value: tournament.teams.length, detail: 'in gara' },
    { label: 'Gironi', value: tournament.groups.length, detail: 'attivi' },
    {
      label: 'Partite',
      value: `${completedMatches.length}/${matches.length}`,
      detail: 'completate',
    },
  ]

  function getTeamName(teamId) {
    if (!teamId) return 'Da definire'

    return (
      tournament.teams.find((team) => team.id === teamId)?.name ??
      'Squadra da definire'
    )
  }

  function getSpotlightStatus(match) {
    if (match.status === 'live' || tournament.liveMatchId === match.id) {
      return 'In corso'
    }

    if (match.status === 'completed') return 'Ultimo risultato'

    return 'Prossimo incontro'
  }

  const spotlightScore = spotlightMatch
    ? getMatchScore(spotlightMatch.sets)
    : null

  return (
    <section className="home-dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-eyebrow">
            Memorial{tournament.edition ? ` · ${tournament.edition}` : ''}
          </p>
          <h2>{tournament.name}</h2>
          <div className="dashboard-hero-meta">
            <span className="dashboard-status-dot" />
            <span>{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
          </div>
        </div>
        <div className="dashboard-court" aria-hidden="true">
          <span />
        </div>
        <span className="dashboard-edition" aria-hidden="true">
          {tournament.edition ?? 'MR'}
        </span>
      </div>

      <MotionDiv
        className="dashboard-metrics"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric, index) => (
          <MotionArticle
            className="metric-card"
            key={metric.label}
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.18 } }}
          >
            <span className="metric-index">0{index + 1}</span>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-label">{metric.label}</span>
            <span className="metric-detail">{metric.detail}</span>
          </MotionArticle>
        ))}
      </MotionDiv>

      <div className="dashboard-lower-grid">
        <MotionArticle
          className={`spotlight-card${liveMatch ? ' is-live' : ''}`}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="spotlight-heading">
            <div>
              <p className="dashboard-eyebrow">In primo piano</p>
              <h3>
                {spotlightMatch
                  ? PHASE_LABELS[spotlightMatch.phase] ?? 'Partita'
                  : 'Il programma'}
              </h3>
            </div>
            {spotlightMatch && (
              <span className="match-status-badge">
                {getSpotlightStatus(spotlightMatch)}
              </span>
            )}
          </div>

          {spotlightMatch ? (
            <>
              <div className="spotlight-scoreboard">
                <div className="scoreboard-team">
                  <span className="team-side-label">A</span>
                  <strong>{getTeamName(spotlightMatch.teamAId)}</strong>
                </div>
                <div className="scoreboard-score" aria-label="Risultato in set">
                  <span>{spotlightScore.teamA}</span>
                  <span className="score-separator">:</span>
                  <span>{spotlightScore.teamB}</span>
                </div>
                <div className="scoreboard-team team-b">
                  <span className="team-side-label">B</span>
                  <strong>{getTeamName(spotlightMatch.teamBId)}</strong>
                </div>
              </div>
              <Link
                className="card-action"
                to={`/partita/${spotlightMatch.id}`}
              >
                Dettaglio partita <span aria-hidden="true">↗</span>
              </Link>
            </>
          ) : (
            <div className="spotlight-empty">
              <p>Il calendario non è ancora stato generato.</p>
              <Link className="card-action" to="/partite">
                Calendario <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </MotionArticle>

        <MotionDiv
          className="dashboard-quick-links"
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <MotionDiv variants={cardVariants}>
            <Link className="quick-link-card" to="/squadre">
              <span className="quick-link-index">01 / SQUADRE</span>
              <strong>Le formazioni</strong>
              <span className="quick-link-arrow" aria-hidden="true">↗</span>
            </Link>
          </MotionDiv>
          <MotionDiv variants={cardVariants}>
            <Link className="quick-link-card" to="/classifica">
              <span className="quick-link-index">02 / CLASSIFICA</span>
              <strong>La corsa al titolo</strong>
              <span className="quick-link-arrow" aria-hidden="true">↗</span>
            </Link>
          </MotionDiv>
        </MotionDiv>
      </div>
    </section>
  )
}