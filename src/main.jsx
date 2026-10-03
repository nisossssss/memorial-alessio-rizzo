import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './app/App'
import { DialogProvider } from './components/ui/DialogProvider'
import TournamentProvider from './state/TournamentProvider'

import './index.css'

createRoot(
  document.getElementById('root'),
).render(
  <StrictMode>
    <BrowserRouter>
      <DialogProvider>
        <TournamentProvider>
          <App />
        </TournamentProvider>
      </DialogProvider>
    </BrowserRouter>
  </StrictMode>,
)