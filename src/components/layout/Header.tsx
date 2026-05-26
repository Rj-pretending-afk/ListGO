import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ShieldCheck } from 'lucide-react'
import { ThemeSwitcher } from '../theme/ThemeSwitcher'
import { useAuthStore } from '../../hooks/useAuth'
import { useLangStore, useT } from '../../hooks/useLang'
import { AvatarDisplay } from '../ui/AvatarDisplay'
import { api } from '../../lib/api'

function LangToggle() {
  const { lang, toggle } = useLangStore()
  return (
    <button
      onClick={toggle}
      className="px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-70 transition-opacity select-none"
      style={{ color: 'var(--color-text)', opacity: 0.55, border: '1px solid var(--color-border)' }}
      title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  )
}

function UserMenu() {
  const navigate = useNavigate()
  const t = useT()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleLogout = () => { setOpen(false); navigate('/'); logout() }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 rounded-lg hover:opacity-80 transition-opacity h-10"
      >
        <AvatarDisplay user={user!} size={32} />
        <span className="text-sm font-medium max-w-[90px] truncate" style={{ color: 'var(--color-text)' }}>
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
            <Link to="/profile" onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm hover:opacity-70"
              style={{ color: 'var(--color-text)' }}>
              {t('profileSettings')}
            </Link>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <button onClick={() => { logout(); setOpen(false); navigate('/login') }}
              className="w-full flex items-center px-4 py-3 text-sm hover:opacity-70"
              style={{ color: 'var(--color-text)', opacity: 0.65 }}>
              {t('switchAccount')}
            </button>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <button onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm hover:opacity-70"
              style={{ color: '#ef4444' }}>
              {t('logout')}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export function Header() {
  const t = useT()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.authLoading)
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    if (!user?.isAdmin) return
    api.get<{ pendingInviteRequests?: number }>('/admin/stats')
      .then(s => setPendingRequests(s.pendingInviteRequests ?? 0))
      .catch(() => {})
  }, [user?.isAdmin])

  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b sticky top-0 z-10"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      <Link to="/" className="font-bold text-lg select-none" style={{ color: 'var(--color-text)' }}>
        ListGo
      </Link>

      <div className="flex items-center gap-2">
        <LangToggle />
        <ThemeSwitcher />

        {!authLoading && user?.isAdmin && (
          <Link to="/admin" className="relative flex items-center p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-primary)' }} title="Admin">
            <ShieldCheck size={18} />
            {pendingRequests > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] flex items-center justify-center font-bold"
                style={{ backgroundColor: '#ef4444', color: 'white' }}>
                {pendingRequests}
              </span>
            )}
          </Link>
        )}
        {!authLoading && (
          user
            ? <UserMenu />
            : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="text-sm px-3 h-9 flex items-center rounded-lg hover:opacity-70"
                  style={{ color: 'var(--color-text)', opacity: 0.65 }}>
                  {t('login')}
                </Link>
                <Link to="/register"
                  className="text-sm px-3 h-9 flex items-center rounded-lg font-medium hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  {t('register')}
                </Link>
              </div>
            )
        )}
      </div>
    </header>
  )
}
