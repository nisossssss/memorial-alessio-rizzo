import { Route, Routes } from 'react-router-dom'

import AdminRoute from '../components/admin/AdminRoute'
import AppShell from '../components/layout/AppShell'

import AdminLogin from '../pages/AdminLogin'
import Draw from '../pages/Draw'
import Final from '../pages/Final'
import Groups from '../pages/Groups'
import Home from '../pages/Home'
import MatchDetail from '../pages/MatchDetail'
import Matches from '../pages/Matches'
import Semifinals from '../pages/Semifinals'
import Sponsors from '../pages/Sponsors'
import Standings from '../pages/Standings'
import TeamDetail from '../pages/TeamDetail'
import Teams from '../pages/Teams'

import AdminHome from '../pages/admin/AdminHome'
import AdminMatchDetail from '../pages/admin/AdminMatchDetail'
import AdminMatches from '../pages/admin/AdminMatches'
import AdminPlayers from '../pages/admin/AdminPlayers'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />

        <Route path="/squadre" element={<Teams />} />

        <Route
          path="/squadre/:id"
          element={<TeamDetail />}
        />

        <Route path="/gironi" element={<Groups />} />

        <Route path="/partite" element={<Matches />} />

        <Route
          path="/partita/:id"
          element={<MatchDetail />}
        />

        <Route
          path="/classifica"
          element={<Standings />}
        />

        <Route
          path="/semifinali"
          element={<Semifinals />}
        />

        <Route path="/finale" element={<Final />} />

        <Route path="/sponsor" element={<Sponsors />} />

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminHome />} />

          <Route
            path="/admin/partecipanti"
            element={<AdminPlayers />}
          />

          <Route
            path="/admin/sorteggio"
            element={<Draw />}
          />

          <Route
            path="/admin/partite"
            element={<AdminMatches />}
          />

          <Route
            path="/admin/partita/:id"
            element={<AdminMatchDetail />}
          />
        </Route>
      </Route>
    </Routes>
  )
}