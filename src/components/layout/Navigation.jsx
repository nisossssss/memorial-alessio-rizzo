import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/gironi', label: 'Gironi' },
  { to: '/partite', label: 'Partite' },
  { to: '/classifica', label: 'Classifica' },
  { to: '/sponsor', label: 'Sponsor' },
]

export default function Navigation() {
  return (
    <nav>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}