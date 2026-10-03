import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/squadre', label: 'Squadre' },
  { to: '/gironi', label: 'Gironi' },
  { to: '/partite', label: 'Partite' },
  { to: '/classifica', label: 'Classifica' },
  { to: '/sponsor', label: 'Sponsor' },
]

export default function Navigation() {
  return (
    <nav className="site-navigation" aria-label="Navigazione principale">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}