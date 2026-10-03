import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

const MotionDiv = motion.div
const MotionArticle = motion.article

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.36, delayChildren: 0.08 },
  },
}

const teamVariants = {
  hidden: { opacity: 0, y: 35, rotateX: -12, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function DrawReveal({ teams, onClose }) {
  const [countdown, setCountdown] = useState(3)
  const [revealing, setRevealing] = useState(false)
  const stageRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    returnFocusRef.current = document.activeElement
    stageRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    if (revealing) return undefined

    const timeoutId = window.setTimeout(() => {
      if (countdown <= 1) {
        setRevealing(true)
      } else {
        setCountdown((current) => current - 1)
      }
    }, 850)

    return () => window.clearTimeout(timeoutId)
  }, [countdown, revealing])

  return (
    <div className="draw-reveal-overlay">
      <MotionDiv
        className="draw-reveal-stage"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-reveal-title"
        aria-describedby="draw-reveal-description"
        tabIndex={-1}
        ref={stageRef}
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {!revealing ? (
          <div className="draw-countdown" aria-live="assertive">
            <p>Il sorteggio è ufficiale</p>
            <MotionDiv
              key={countdown}
              className="draw-countdown-number"
              initial={{ opacity: 0, scale: 1.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -20 }}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              {countdown}
            </MotionDiv>
            <span id="draw-reveal-description">Pronti a conoscere le squadre?</span>
          </div>
        ) : (
          <>
            <div className="draw-reveal-heading">
              <div>
                <p>Memorial Alessio Rizzo · Sorteggio ufficiale</p>
                <h2 id="draw-reveal-title">Le squadre sono qui.</h2>
                <span id="draw-reveal-description">
                  6 formazioni. 48 atlete. Un solo torneo.
                </span>
              </div>
              <span className="draw-reveal-stamp" aria-hidden="true">DRAW<br />2026</span>
            </div>

            <MotionDiv
              className="draw-reveal-teams-grid"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
            >
              {teams.map((team, index) => {
                const players = [...(team.players ?? [])].sort((a, b) =>
                  a.name.localeCompare(b.name, 'it'),
                )

                return (
                  <MotionArticle
                    className="draw-reveal-team"
                    key={team.id}
                    variants={teamVariants}
                    style={{ transformPerspective: 900 }}
                  >
                    <div className="draw-reveal-team-kicker">
                      <span>Formazione {String(index + 1).padStart(2, '0')}</span>
                      <span>{String(players.length).padStart(2, '0')} atlete</span>
                    </div>
                    <h3>{team.name}</h3>
                    <ul>
                      {players.map((player, playerIndex) => (
                        <li key={player.id}>
                          <span>{String(playerIndex + 1).padStart(2, '0')}</span>
                          {player.name}
                        </li>
                      ))}
                    </ul>
                  </MotionArticle>
                )
              })}
            </MotionDiv>

            <div className="draw-reveal-footer">
              <span>Il torneo può cominciare.</span>
              <button type="button" onClick={onClose}>
                Entra nel torneo <span aria-hidden="true">↗</span>
              </button>
            </div>
          </>
        )}
      </MotionDiv>
    </div>
  )
}