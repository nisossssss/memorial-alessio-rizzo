import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { buildGroupStandings } from '../domain/standings'
import { useTournament } from '../state/TournamentContext'

const MotionDiv = motion.div
const MotionArticle = motion.article

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Groups() {
  const { tournament } = useTournament()
  const groupMatches = tournament.matches.filter(
    (match) => match.phase === 'group',
  )
  const completedMatches = groupMatches.filter(
    (match) => match.status === 'completed',
  ).length

  return (
    <section className="groups-page">
      <div className="competition-hero">
        <div>
          <p className="competition-eyebrow">Il percorso verso la finale</p>
          <h2>Fase a gironi</h2>
          <p>Classifiche aggiornate con i risultati ufficiali del torneo.</p>
        </div>
        <span className="competition-hero-mark" aria-hidden="true">GRUPPI</span>
      </div>

      <div className="competition-metrics" aria-label="Riepilogo gironi">
        <div><strong>{tournament.groups.length}</strong><span>Gironi</span></div>
        <div><strong>{tournament.teams.length}</strong><span>Squadre</span></div>
        <div><strong>{completedMatches}</strong><span>Partite concluse</span></div>
      </div>

      {tournament.groups.length === 0 ? (
        <div className="competition-empty-state">
          <span>01</span>
          <div>
            <h3>Gironi non ancora sorteggiati</h3>
            <p>Le classifiche appariranno qui appena saranno composti i gruppi.</p>
          </div>
        </div>
      ) : (
        <MotionDiv
          className="groups-grid"
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
        >
          {tournament.groups.map((group) => {
            const matches = groupMatches.filter(
              (match) => match.groupId === group.id,
            )
            const standings = buildGroupStandings(group.teamIds, matches)

            return (
              <MotionArticle
                className="group-standings-card"
                key={group.id}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
              >
                <div className="group-card-header">
                  <div>
                    <p>Classifica ufficiale</p>
                    <h3>{group.name}</h3>
                  </div>
                  <span className="group-letter">{group.id}</span>
                </div>

                <div className="group-table-head" aria-hidden="true">
                  <span>Pos</span>
                  <span>Squadra</span>
                  <span>V-P</span>
                  <span>Pt</span>
                </div>

                <ol className="group-standings-list">
                  {standings.map((entry, index) => {
                    const team = tournament.teams.find(
                      (item) => item.id === entry.teamId,
                    )

                    return (
                      <li key={entry.teamId}>
                        <span className="group-position">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <Link to={`/squadre/${entry.teamId}`}>
                          {team?.name ?? entry.teamId}
                        </Link>
                        <span className="group-record">
                          {entry.wins}-{entry.losses}
                        </span>
                        <strong className="group-points">{entry.points}</strong>
                      </li>
                    )
                  })}
                </ol>

                <div className="group-card-footer">
                  <span>{matches.length} incontri</span>
                  <span>{matches.filter((match) => match.status === 'completed').length} conclusi</span>
                </div>
              </MotionArticle>
            )
          })}
        </MotionDiv>
      )}
    </section>
  )
}