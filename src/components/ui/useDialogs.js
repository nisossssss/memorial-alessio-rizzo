import { useContext } from 'react'

import { DialogContext } from './DialogContext'

export default function useDialogs() {
  const context = useContext(DialogContext)

  if (!context) {
    throw new Error('useDialogs must be used inside DialogProvider')
  }

  return context
}