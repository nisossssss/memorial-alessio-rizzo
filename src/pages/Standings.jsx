import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
    buildFinalStandings,
    buildGroupStandings,
} from '../domain/standings'
import { useTournament } from '../state/TournamentContext'

const MotionArticle = motion.article

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
}

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
  }, [tournament.groups, tournament.matches])

  const finalStandings = useMemo(
    () =>
      buildFinalStandings(
        tournament.teams,
        tournament.matches,
      ),
    [tournament.teams, tournament.matches],
  )

  const completedGroupMatches = tournament.matches.filter(
    (match) => match.phase === 'group' && match.status === 'completed',
  ).length

  function getTeamName(teamId) {
    return (
      tournament.teams.find(
        (team) => team.id === teamId,
      )?.name ?? teamId
    )
  }

  if (tournament.groups.length === 0) {
    return (
      <section className="standings-page">
        <CompetitionHero isFinal={false} />
        <div className="competition-empty-state">
          <span>01</span>
          <div>
            <h3>Classifica in preparazione</h3>
            <p>I punteggi appariranno dopo il sorteggio dei gironi.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="standings-page">
      <CompetitionHero isFinal={finalStandings.length > 0} />

      <div className="competition-metrics" aria-label="Riepilogo classifica">
        <div><strong>{tournament.groups.length}</strong><span>Gironi</span></div>
        <div><strong>{completedGroupMatches}</strong><span>Partite valide</span></div>
        <div>
          <strong>{finalStandings.length > 0 ? 'OK' : 'LIVE'}</strong>
          <span>{finalStandings.length > 0 ? 'Classifica finale' : 'Classifica provvisoria'}</span>
        </div>
      </div>

      {finalStandings.length > 0 && (
        <MotionArticle
          className="final-standings-panel"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="final-standings-heading">
            <div>
              <p>Piazzamenti ufficiali</p>
              <h3>Classifica finale</h3>
            </div>
            <span>Memorial · finale</span>
          </div>
          <div className="final-placements-grid">
            {finalStandings.map((entry) => (
              <Link
                className={`final-placement position-${entry.position}`}
                key={entry.teamId}
                to={`/squadre/${entry.teamId}`}
              >
                <span className="placement-number">{String(entry.position).padStart(2, '0')}</span>
                <strong>{getTeamName(entry.teamId)}</strong>
                <span className="placement-label">
                  {entry.position === 1 ? 'Campione' : `${entry.position}° posto`}
                </span>
              </Link>
            ))}
          </div>
          <p>
            Il 1° e 2° posto sono determinati dalla finale.
            Il 3° e 4° posto sono assegnati alle perdenti
            delle semifinali, confrontando punti in
            classifica, set vinti e punti subiti nelle
            partite dei gironi e nelle semifinali.
            Il 5° e 6° posto sono determinati dalla
            partita dedicata.
          </p>
        </MotionArticle>
      )}

      <div className="standings-groups-grid">
        {standingsByGroup.map(({ group, standings }, groupIndex) => (
          <MotionArticle
            className="public-standings-card"
            key={group.id}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            transition={{ delay: groupIndex * 0.08 }}
          >
            <div className="public-standings-heading">
              <div>
                <p>Classifica provvisoria</p>
                <h3>{group.name}</h3>
              </div>
              <span>{group.id}</span>
            </div>

            <div className="standings-table-wrap">
              <table className="public-standings-table">
                <thead>
                  <tr>
                    <th>PT</th>
                    <th>Pos</th>
                    <th>Squadra</th>
                    <th>G</th>
                    <th>V-P</th>
                    <th>SV-SP</th>
                    <th>PF-PS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, index) => (
                    <tr key={entry.teamId}>
                      <td>
                        <strong className="standings-points">{entry.points}</strong>
                      </td>
                      <td>
                        <span className={`standings-position${index < 2 ? ' advances' : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <Link to={`/squadre/${entry.teamId}`}>
                          {getTeamName(entry.teamId)}
                        </Link>
                      </td>
                      <td>{entry.played}</td>
                      <td>{entry.wins}<span className="standings-pair-separator">-</span>{entry.losses}</td>
                      <td>{entry.setsWon}<span className="standings-pair-separator">-</span>{entry.setsLost}</td>
                      <td>{entry.pointsScored}<span className="standings-pair-separator">-</span>{entry.pointsConceded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MotionArticle>
        ))}
      </div>

      <p className="standings-legend">
        G partite · V vittorie · P sconfitte · SV set vinti · SP set persi ·
        PF punti fatti · PS punti subiti · PT punti in classifica.
      </p>
    </section>
  )
}

function CompetitionHero({ isFinal }) {
  return (
    <div className="competition-hero standings-hero">
      <div>
        <p className="competition-eyebrow">La corsa al titolo</p>
        <h2>Classifica</h2>
        <p>
          {isFinal
            ? 'Piazzamenti ufficiali e risultati di ogni girone.'
            : 'Ogni punto pesa. Segui la posizione delle squadre.'}
        </p>
      </div>
      <span className="competition-hero-mark" aria-hidden="true">RANK</span>
    </div>
  )
}