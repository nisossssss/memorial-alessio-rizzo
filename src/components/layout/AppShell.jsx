import { Outlet } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'

export default function AppShell() {
  return (
    <div>
      <Header />
      <Navigation />

      <main>
        <Outlet />
      </main>
    </div>
  )
}