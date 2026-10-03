import { AnimatePresence, motion } from 'motion/react'
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'

import { DialogContext } from './DialogContext'

const MotionDiv = motion.div
const MotionSection = motion.section

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const titleId = useId()
  const messageId = useId()

  const openDialog = useCallback((type, options) => {
    if (resolverRef.current) {
      return Promise.resolve(false)
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({ type, ...options })
    })
  }, [])

  const confirm = useCallback(
    (options) => openDialog('confirm', options),
    [openDialog],
  )

  const alert = useCallback(
    (options) => openDialog('alert', options),
    [openDialog],
  )

  const settle = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }, [])

  useEffect(() => {
    if (!dialog) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [dialog])

  const contextValue = { confirm, alert }

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {dialog && (
          <MotionDiv
            className="app-dialog-backdrop"
            key="app-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                settle(false)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                settle(false)
              }
            }}
          >
            <MotionSection
              className={`app-dialog${dialog.tone === 'danger' ? ' is-danger' : ''}`}
              role={dialog.type === 'confirm' ? 'alertdialog' : 'dialog'}
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={messageId}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <span className="app-dialog-mark" aria-hidden="true">
                {dialog.tone === 'danger' ? '!' : 'i'}
              </span>
              <div className="app-dialog-copy">
                <p>{dialog.eyebrow ?? 'Memorial Alessio Rizzo'}</p>
                <h2 id={titleId}>{dialog.title}</h2>
                <div id={messageId}>{dialog.message}</div>
              </div>
              <div className="app-dialog-actions">
                {dialog.type === 'confirm' && (
                  <button
                    className="app-dialog-cancel"
                    type="button"
                    ref={cancelButtonRef}
                    onClick={() => settle(false)}
                  >
                    {dialog.cancelLabel ?? 'Annulla'}
                  </button>
                )}
                <button
                  className={`app-dialog-confirm${dialog.tone === 'danger' ? ' is-danger' : ''}`}
                  type="button"
                  autoFocus={dialog.type === 'alert'}
                  onClick={() => settle(true)}
                >
                  {dialog.confirmLabel ?? (dialog.type === 'alert' ? 'Ho capito' : 'Conferma')}
                </button>
              </div>
            </MotionSection>
          </MotionDiv>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  )
}