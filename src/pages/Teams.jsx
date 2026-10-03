import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useTournament } from '../state/TournamentContext'

const MotionDiv = motion.div
const MotionArticle = motion.article

const teamGridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const teamCardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Teams() {
  const { tournament } = useTournament()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch('/api/admin-session', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) return

        const result = await response.json()

        if (!controller.signal.aborted) {
          setIsAdmin(result.authenticated === true)
        }
      } catch {
        // La consultazione pubblica rimane disponibile.
      }
    }

    checkSession()

    return () => controller.abort()
  }, [])

  const teams = [...tournament.teams].sort((a, b) =>
    a.name.localeCompare(b.name, 'it'),
  )

  const hasCalendar = tournament.matches.length > 0
  const playerCount = teams.reduce(
    (total, team) => total + team.players.length,
    0,
  )

  return (
    <section className="teams-page">
      <header className="teams-hero">
        <div className="teams-hero-copy">
          <p className="teams-eyebrow">Roster ufficiali</p>
          <h2>Le squadre</h2>
          <p>Ogni formazione, ogni giocatrice. Tutto il torneo parte da qui.</p>
        </div>
        <MotionDiv
          className="teams-hero-count"
          initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <strong>{String(teams.length).padStart(2, '0')}</strong>
          <span>Squadre</span>
        </MotionDiv>
        <span className="teams-hero-court" aria-hidden="true" />
      </header>

      <div className="teams-overview" aria-label="Riepilogo squadre">
        <div><strong>{teams.length}</strong><span>Formazioni</span></div>
        <div><strong>{playerCount}</strong><span>Atlete</span></div>
        <div><strong>{tournament.groups.length}</strong><span>Gironi</span></div>
        {isAdmin && (
          <div className="teams-admin-actions">
            <Link to="/admin/sorteggio">
              {teams.length === 0
                ? 'Sorteggia squadre'
                : hasCalendar
                  ? 'Gestione squadre e gironi'
                  : 'Gestisci squadre'}
              <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/admin">Amministrazione</Link>
          </div>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="teams-empty-state">
          <span className="teams-empty-mark" aria-hidden="true">+</span>
          <div>
            <h3>Il sorteggio deve ancora iniziare</h3>
            <p>Le formazioni e i roster appariranno qui appena saranno definiti.</p>
          </div>
        </div>
      ) : (
        <MotionDiv
          className="teams-grid"
          variants={teamGridVariants}
          initial="hidden"
          animate="visible"
        >
          {teams.map((team, index) => {
            const players = [...team.players].sort((a, b) =>
              a.name.localeCompare(b.name, 'it'),
            )

            return (
              <MotionArticle
                className="team-preview-card"
                key={team.id}
                variants={teamCardVariants}
                whileHover={{ y: -5, transition: { duration: 0.18 } }}
              >
                <div className="team-card-kicker">
                  <span>Formazione {String(index + 1).padStart(2, '0')}</span>
                  <span className="team-group-pill">
                    {team.groupId ? `Girone ${team.groupId}` : 'Da sorteggiare'}
                  </span>
                </div>
                <div className="team-card-identity">
                  <span className="team-monogram" aria-hidden="true">
                    {team.name.charAt(0)}
                  </span>
                  <div>
                    <h3>{team.name}</h3>
                    <span>{players.length} atlete</span>
                  </div>
                </div>
                <ul className="team-preview-roster">
                  {players.slice(0, 3).map((player, playerIndex) => (
                    <li key={player.id}>
                      <span>{String(playerIndex + 1).padStart(2, '0')}</span>
                      <strong>{player.name}</strong>
                    </li>
                  ))}
                  {players.length > 3 && (
                    <li className="team-roster-more">
                      <span>+</span>
                      <strong>Altre {players.length - 3} atlete</strong>
                    </li>
                  )}
                </ul>
                <Link className="team-card-link" to={`/squadre/${team.id}`}>
                  Apri la squadra <span aria-hidden="true">↗</span>
                </Link>
              </MotionArticle>
            )
          })}
        </MotionDiv>
      )}
    </section>
  )
}