import { motion } from 'motion/react'

import MatchCard from '../components/MatchCard'
import { useTournament } from '../state/TournamentContext'

const MotionDiv = motion.div

const PHASES = [
  { id: 'semifinal', label: 'Semifinali', eyebrow: 'Verso la finale' },
  { id: 'placement_5_6', label: '5° / 6° posto', eyebrow: 'Piazzamento' },
  { id: 'final', label: 'Finale', eyebrow: 'La sfida decisiva' },
]

export default function Matches() {
  const { tournament } = useTournament()

  const groupMatches = tournament.matches.filter(
    (match) => match.phase === 'group',
  )

  const completedMatches = tournament.matches.filter(
    (match) => match.status === 'completed',
  )
  const liveMatches = tournament.matches.filter(
    (match) =>
      match.status === 'live' ||
      tournament.liveMatchId === match.id,
  )

  return (
    <section className="matches-page">
      <div className="competition-hero">
        <div>
          <p className="competition-eyebrow">Ogni punto, ogni sfida</p>
          <h2>Calendario</h2>
          <p>Segui il torneo dai gironi fino all’ultima partita.</p>
        </div>
        <span className="competition-hero-mark" aria-hidden="true">MATCH</span>
      </div>

      <div className="competition-metrics" aria-label="Riepilogo partite">
        <div><strong>{tournament.matches.length}</strong><span>Incontri</span></div>
        <div><strong>{completedMatches.length}</strong><span>Conclusi</span></div>
        <div><strong>{liveMatches.length}</strong><span>Live</span></div>
      </div>

      {tournament.matches.length === 0 ? (
        <div className="competition-empty-state">
          <span>01</span>
          <div>
            <h3>Il calendario non è ancora pronto</h3>
            <p>Gli incontri compariranno qui dopo il sorteggio ufficiale.</p>
          </div>
        </div>
      ) : (
        <div className="match-schedule">
          <section className="match-stage-section">
            <StageHeading
              number="01"
              eyebrow="Round robin"
              title="Fase a gironi"
              count={groupMatches.length}
            />

            {tournament.groups.length > 0 ? (
              <div className="group-fixtures-grid">
                {tournament.groups.map((group) => {
                  const matches = groupMatches.filter(
                    (match) => match.groupId === group.id,
                  )

                  return (
                    <div className="group-fixtures-card" key={group.id}>
                      <div className="group-fixtures-heading">
                        <div>
                          <span>Pool {group.id}</span>
                          <h4>{group.name}</h4>
                        </div>
                        <span>{matches.length} match</span>
                      </div>
                      {matches.length > 0 ? (
                        <div className="fixtures-grid">
                          {matches.map((match, index) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              title={`Incontro ${String(index + 1).padStart(2, '0')}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="fixtures-empty">Incontri non ancora generati.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="fixtures-empty">I gironi saranno visibili dopo il sorteggio.</p>
            )}
          </section>

          {PHASES.map((phase, index) => {
            const matches = tournament.matches.filter(
              (match) => match.phase === phase.id,
            )

            return (
              <section className="match-stage-section" key={phase.id}>
                <StageHeading
                  number={String(index + 2).padStart(2, '0')}
                  eyebrow={phase.eyebrow}
                  title={phase.label}
                  count={matches.length}
                />
                {matches.length > 0 ? (
                  <MotionDiv
                    className="fixtures-grid knockout-fixtures-grid"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.08 }}
                    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  >
                    {matches.map((match, matchIndex) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        title={`${phase.label} ${matches.length > 1 ? matchIndex + 1 : ''}`.trim()}
                      />
                    ))}
                  </MotionDiv>
                ) : (
                  <p className="fixtures-empty">Questa fase non è ancora stata generata.</p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StageHeading({ number, eyebrow, title, count }) {
  return (
    <div className="stage-heading">
      <span className="stage-number">{number}</span>
      <div>
        <p>{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      <span className="stage-count">{count} incontri</span>
    </div>
  )
}