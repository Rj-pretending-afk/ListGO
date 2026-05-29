import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ProfileCard } from '../ui/ProfileCard'
import { useT } from '../../hooks/useLang'
import type { PresenceUser } from '../../lib/api'

interface AvatarStackProps {
  users: PresenceUser[]
  selfUserId: string | null
}

const MAX_SHOWN = 5

export function AvatarStack({ users, selfUserId }: AvatarStackProps) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const [profileCard, setProfileCard] = useState<string | null>(null)

  if (users.length === 0) return null

  const shown = users.slice(0, MAX_SHOWN)
  const overflow = users.length - MAX_SHOWN

  const label = (u: PresenceUser) => {
    const name = u.displayName ?? (u.isAnonymous ? t('userGuest') : '?')
    return name[0].toUpperCase()
  }

  const title = (u: PresenceUser) =>
    u.displayName ?? (u.isAnonymous ? t('userAnonymous') : t('userUnknown'))

  return (
    <div className="relative flex items-center flex-shrink-0">
      {/* Overlapping avatar circles */}
      <div
        className="flex cursor-pointer"
        onClick={() => setExpanded(v => !v)}
        title={t('onlineCount').replace('{n}', String(users.length))}
        style={{ gap: 0 }}
      >
        {shown.map((u, i) => (
          <div
            key={u.userId}
            className="w-6 h-6 rounded-full select-none border-2 transition-transform hover:scale-110 flex-shrink-0 overflow-hidden"
            style={{
              backgroundColor: u.color,
              borderColor: 'var(--color-bg)',
              marginLeft: i === 0 ? 0 : -6,
              zIndex: MAX_SHOWN - i,
              opacity: u.userId === selfUserId ? 0.55 : 1,
            }}
            title={title(u)}
          >
            {u.avatarImage
              ? <img src={u.avatarImage} alt={title(u)} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white" style={{ fontSize: 9, fontWeight: 700 }}>{label(u)}</span>
            }
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white select-none border-2 flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-border)',
              borderColor: 'var(--color-bg)',
              fontSize: 9,
              fontWeight: 700,
              marginLeft: -6,
              color: 'var(--color-text)',
            }}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Expanded popover */}
      {expanded && createPortal(
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setExpanded(false)} />
          <div
            className="fixed z-[151] rounded-xl shadow-xl py-2 min-w-[140px]"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              top: 112,
              right: 16,
            }}
          >
            <p className="text-xs px-3 pb-1.5 border-b" style={{ color: 'var(--color-text)', opacity: 0.4, borderColor: 'var(--color-border)' }}>
              {t('onlineCount').replace('{n}', String(users.length))}
            </p>
            {users.map(u => (
              <div
                key={u.userId}
                className={`flex items-center gap-2 px-3 py-1.5 ${!u.isAnonymous && u.username ? 'cursor-pointer hover:opacity-70' : ''}`}
                onClick={() => {
                  if (!u.isAnonymous && u.username) {
                    setExpanded(false)
                    setProfileCard(u.username)
                  }
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: u.color }}
                >
                  {u.avatarImage
                    ? <img src={u.avatarImage} alt={title(u)} className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center text-white" style={{ fontSize: 8, fontWeight: 700 }}>{label(u)}</span>
                  }
                </div>
                <span className="text-xs truncate" style={{ color: 'var(--color-text)', opacity: u.userId === selfUserId ? 0.45 : 0.85 }}>
                  {title(u)}{u.userId === selfUserId ? ` (${t('selfLabel')})` : ''}
                </span>
              </div>
            ))}
          </div>
        </>,
        document.body
      )}

      {profileCard && (
        <ProfileCard username={profileCard} onClose={() => setProfileCard(null)} />
      )}
    </div>
  )
}
