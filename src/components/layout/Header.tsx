import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ThemeSwitcher } from '../theme/ThemeSwitcher'
import { useAuthStore } from '../../hooks/useAuth'
import { AvatarDisplay } from '../../pages/ProfilePage'

function UserMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
      >
        <AvatarDisplay user={user!} size={28} />
        <span className="text-sm max-w-[80px] truncate" style={{ color: 'var(--color-text)' }}>
          {user!.displayName}
        </span>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[301] rounded-xl shadow-xl overflow-hidden"
            style={{
              top: (btnRef.current?.getBoundingClientRect().bottom ?? 0) + 6,
              right: window.innerWidth - (btnRef.current?.getBoundingClientRect().right ?? 0),
              width: '10rem',
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-2.5 text-sm hover:opacity-70"
              style={{ color: 'var(--color-text)' }}
            >
              个人设置
            </Link>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm hover:opacity-70"
              style={{ color: '#ef4444' }}
            >
              退出登录
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export function Header() {
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.authLoading)

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
        ListGo
      </Link>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />

        {!authLoading && (
          user
            ? <UserMenu />
            : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm px-3 py-1.5 rounded-lg hover:opacity-70"
                  style={{ color: 'var(--color-text)', opacity: 0.6 }}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-3 py-1.5 rounded-lg font-medium hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  注册
                </Link>
              </div>
            )
        )}
      </div>
    </header>
  )
}
