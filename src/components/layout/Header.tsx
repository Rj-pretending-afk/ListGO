import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Link2, Users } from 'lucide-react'
import { ThemeSwitcher } from '../theme/ThemeSwitcher'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '../../hooks/useAuth'
import { useLangStore, useT } from '../../hooks/useLang'
import { AvatarDisplay } from '../ui/AvatarDisplay'
import FriendsPage from '../../pages/FriendsPage'

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

function extractListId(input: string): string | null {
  const trimmed = input.trim()
  const match = trimmed.match(/\/(?:l|list)\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]{4,}$/.test(trimmed)) return trimmed
  return null
}

function JoinListButton() {
  const t = useT()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleGo = () => {
    const id = extractListId(value)
    if (!id) return
    setOpen(false)
    setValue('')
    navigate(`/list/${id}`)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)' }}
        title={t('joinList')}
      >
        <Link2 size={17} />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => { setOpen(false); setValue('') }} />
          <div
            className="fixed z-[301] rounded-xl shadow-xl p-3"
            style={{
              top: (btnRef.current?.getBoundingClientRect().bottom ?? 0) + 6,
              right: window.innerWidth - (btnRef.current?.getBoundingClientRect().right ?? 0),
              width: '18rem',
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
              {t('joinList')}
            </p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGo(); if (e.key === 'Escape') { setOpen(false); setValue('') } }}
                placeholder={t('joinListPlaceholder')}
                className="flex-1 text-xs px-2.5 py-2 rounded-lg outline-none"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                onClick={handleGo}
                disabled={!extractListId(value)}
                className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-35"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                {t('joinListGo')}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
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
  const [friendsOpen, setFriendsOpen] = useState(false)
  return (
    <>
    <header
      className="h-14 flex items-center justify-between px-4 border-b sticky top-0 z-10"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      <Link to="/" className="font-bold text-lg select-none" style={{ color: 'var(--color-text)' }}>
        ListGo
      </Link>

      <div className="flex items-center gap-2">
        <LangToggle />
        <JoinListButton />
        <ThemeSwitcher />

        {!authLoading && (
          user
            ? (
              <>
                <button
                  onClick={() => setFriendsOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-text)' }}
                  title={t('friendsTitle')}
                >
                  <Users size={17} />
                </button>
                <NotificationBell />
                <UserMenu />
              </>
            )
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

    {friendsOpen && createPortal(
      <>
        <div
          className="fixed inset-0 z-[200]"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setFriendsOpen(false)}
        />
        <div
          className="fixed top-0 right-0 h-full z-[201] flex flex-col overflow-hidden"
          style={{
            width: 'min(420px, 100vw)',
            backgroundColor: 'var(--color-bg)',
            borderLeft: '1px solid var(--color-border)',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex-1 overflow-y-auto">
            <FriendsPage asPanel onClose={() => setFriendsOpen(false)} />
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  )
}
