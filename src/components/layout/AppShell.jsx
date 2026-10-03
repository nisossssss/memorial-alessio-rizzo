import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTournament } from '../../state/TournamentContext'
import AlessioCarousel from './AlessioCarousel'
import DrawReveal from './DrawReveal'
import Header from './Header'
import Navigation from './Navigation'
import SponsorTicker from './SponsorTicker'

const MotionDiv = motion.div

export default function AppShell() {
  const location = useLocation()
  const { tournament, drawRevealId } = useTournament()
  const [dismissedRevealId, setDismissedRevealId] = useState(0)
  const closeDrawReveal = useCallback(() => {
    setDismissedRevealId(drawRevealId)
  }, [drawRevealId])
  const showDrawReveal =
    drawRevealId > 0 && drawRevealId !== dismissedRevealId

  return (
    <MotionConfig reducedMotion="user">
      <div className="site-shell">
        {showDrawReveal && (
          <DrawReveal
            key={drawRevealId}
            teams={tournament.teams}
            onClose={closeDrawReveal}
          />
        )}
        <Header />
        <Navigation />

        <main className="site-main">
          <AlessioCarousel />
          <AnimatePresence mode="wait" initial={false}>
            <MotionDiv
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </MotionDiv>
          </AnimatePresence>
        </main>
        <SponsorTicker />
      </div>
    </MotionConfig>
  )
}