import { Route, Routes } from 'react-router-dom'

import Draw from '../pages/Draw'
import Final from '../pages/Final'
import Groups from '../pages/Groups'
import Home from '../pages/Home'
import MatchDetail from '../pages/MatchDetail'
import Matches from '../pages/Matches'
import Memorial from '../pages/Memorial'
import Semifinals from '../pages/Semifinals'
import Sponsors from '../pages/Sponsors'
import Standings from '../pages/Standings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sorteggio" element={<Draw />} />
      <Route path="/gironi" element={<Groups />} />
      <Route path="/partite" element={<Matches />} />
      <Route path="/partita/:id" element={<MatchDetail />} />
      <Route path="/classifica" element={<Standings />} />
      <Route path="/semifinali" element={<Semifinals />} />
      <Route path="/finale" element={<Final />} />
      <Route path="/memorial" element={<Memorial />} />
      <Route path="/sponsor" element={<Sponsors />} />
    </Routes>
  )
}