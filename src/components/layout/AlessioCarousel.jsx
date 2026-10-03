import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const photos = [
  {
    src: '/images/alessio/alessio-scooter.jpg',
    alt: 'Alessio in sella al suo scooter.',
    caption: 'Un sorriso che resta con noi.',
  },
  {
    src: '/images/alessio/alessio-selfie.jpg',
    alt: 'Alessio in un selfie all’aperto insieme a un’altra persona.',
    caption: 'I momenti condivisi continuano a vivere.',
  },
]

const MotionDiv = motion.div
const MotionImage = motion.img
const AUTOPLAY_INTERVAL = 6000

export default function AlessioCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const pointerStartRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const autoplayPaused =
    isHovered || hasFocus || isDragging || prefersReducedMotion
  const activePhoto = photos[activeIndex]

  useEffect(() => {
    if (autoplayPaused) return undefined

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length)
    }, AUTOPLAY_INTERVAL)

    return () => window.clearInterval(intervalId)
  }, [autoplayPaused])

  function showPhoto(offset) {
    setActiveIndex((current) =>
      (current + offset + photos.length) % photos.length,
    )
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    pointerStartRef.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  function handlePointerUp(event) {
    const pointerStart = pointerStartRef.current
    if (pointerStart === null) return

    const distance = event.clientX - pointerStart
    if (Math.abs(distance) > 48) {
      showPhoto(distance < 0 ? 1 : -1)
    }

    pointerStartRef.current = null
    setIsDragging(false)
  }

  function handlePointerCancel() {
    pointerStartRef.current = null
    setIsDragging(false)
  }

  function handlePhotoKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPhoto(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      showPhoto(1)
    }
  }

  return (
    <section
      className="alessio-carousel"
      role="region"
      aria-roledescription="carosello"
      aria-label="Ricordi di Alessio Rizzo"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocus(false)
        }
      }}
    >
      <div
        className={`alessio-carousel-image${isDragging ? ' is-dragging' : ''}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`Foto ${activeIndex + 1} di ${photos.length}. Trascina per cambiare immagine.`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handlePhotoKeyDown}
      >
        <AnimatePresence mode="wait" initial={false}>
          <MotionImage
            key={activePhoto.src}
            src={activePhoto.src}
            alt={activePhoto.alt}
            draggable="false"
            initial={{ opacity: 0, scale: 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        <span className="alessio-photo-count">
          {String(activeIndex + 1).padStart(2, '0')}
          <span> / {String(photos.length).padStart(2, '0')}</span>
        </span>
      </div>

      <div
        className="alessio-carousel-copy"
        aria-live={autoplayPaused ? 'polite' : 'off'}
      >
        <p className="alessio-carousel-eyebrow">Memorial Alessio Rizzo</p>
        <h2>Il suo ricordo, sempre in campo.</h2>
        <p className="alessio-carousel-caption">{activePhoto.caption}</p>

        <MotionDiv
          className="alessio-carousel-index"
          aria-hidden="true"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          ALESSIO
        </MotionDiv>
      </div>
    </section>
  )
}