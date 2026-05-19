import { Link } from 'react-router-dom'
import { ThemeSwitcher } from '../theme/ThemeSwitcher'

export function Header() {
  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b sticky top-0 z-10"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      <Link
        to="/"
        className="font-bold text-lg select-none"
        style={{ color: 'var(--color-text)' }}
      >
        💌 ListGo
      </Link>
      <ThemeSwitcher />
    </header>
  )
}
