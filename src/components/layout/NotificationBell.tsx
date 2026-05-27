import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShieldAlert } from 'lucide-react'
import { createPortal } from 'react-dom'
import { notificationApi, pokeApi } from '../../lib/api'
import { AvatarDisplay } from '../ui/AvatarDisplay'
import { ProfileCard } from '../ui/ProfileCard'
import { useT } from '../../hooks/useLang'
import type { PokeInfo, ListInvitationNotif } from '../../types/user.types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLangStore } from '../../hooks/useLang'

function timeAgo(ts: number, lang: string) {
  return formatDistanceToNow(ts, { locale: lang === 'zh' ? zhCN : undefined, addSuffix: true })
}

export function NotificationBell() {
  const t = useT()
  const lang = useLangStore(s => s.lang)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pokes, setPokes] = useState<PokeInfo[]>([])
  const [invites, setInvites] = useState<ListInvitationNotif[]>([])
  const [pendingAdmin, setPendingAdmin] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profileCard, setProfileCard] = useState<string | null>(null) // username to show
  const btnRef = useRef<HTMLButtonElement>(null)

  const totalUnread = pokes.length + invites.length + pendingAdmin

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationApi.getAll()
      setPokes(data.pokes)
      setInvites(data.listInvitations)
      setPendingAdmin(data.pendingAdminRequests ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  // Poll every 30s
  useEffect(() => {
    void fetchAll()
    const id = setInterval(() => void fetchAll(), 30000)
    return () => clearInterval(id)
  }, [fetchAll])

  const handlePokeClick = async (p: PokeInfo) => {
    await notificationApi.markPokeRead(p.id).catch(() => undefined)
    setPokes(prev => prev.filter(item => item.id !== p.id))
    // Send return poke so sender receives pokee's poke_message
    pokeApi.send(p.senderId).catch(() => undefined)
    // Show sender's profile card (stay on current page)
    setProfileCard(p.senderUsername)
  }

  const markInviteRead = async (id: string, listId: string) => {
    await notificationApi.markInvitationRead(id).catch(() => undefined)
    setInvites(prev => prev.filter(i => i.id !== id))
    setOpen(false)
    navigate(`/list/${listId}`)
  }

  const markAllRead = async () => {
    await Promise.all([
      ...pokes.map(p => notificationApi.markPokeRead(p.id).catch(() => undefined)),
      ...invites.map(i => notificationApi.markInvitationRead(i.id).catch(() => undefined)),
    ])
    setPokes([])
    setInvites([])
  }

  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => { setOpen(v => !v); if (!open) void fetchAll() }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)' }}
        title={t('notifTitle')}
      >
        <Bell size={17} />
        {totalUnread > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full text-[9px] font-bold flex items-center justify-center px-[3px]"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[301] rounded-xl shadow-xl overflow-hidden flex flex-col"
            style={{
              top: (btnRef.current?.getBoundingClientRect().bottom ?? 0) + 6,
              right: window.innerWidth - (btnRef.current?.getBoundingClientRect().right ?? 0),
              width: '22rem',
              maxHeight: '26rem',
              ...cardStyle,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('notifTitle')}</span>
              {totalUnread > 0 && (
                <button onClick={() => void markAllRead()}
                  className="text-xs hover:opacity-70"
                  style={{ color: 'var(--color-primary)' }}>
                  {t('notifMarkRead')}
                </button>
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {loading && pokes.length === 0 && invites.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--color-text)', opacity: 0.4 }}>{t('loading')}</p>
              ) : pokes.length === 0 && invites.length === 0 && pendingAdmin === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--color-text)', opacity: 0.4 }}>{t('notifEmpty')}</p>
              ) : (
                <>
                  {/* Pokes section */}
                  {pokes.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider px-4 pt-3 pb-1 font-semibold"
                        style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                        {t('notifPokes')}
                      </p>
                      {pokes.map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80 cursor-pointer"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                          onClick={() => void handlePokeClick(p)}>
                          <AvatarDisplay
                            user={{ username: p.senderUsername, avatarColor: p.senderAvatarColor, avatarImage: p.senderAvatarImage }}
                            size={30}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                              {t('notifPokedBy').replace('{name}', p.senderDisplayName)}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                              {timeAgo(p.createdAt, lang)}
                            </p>
                          </div>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
                        </div>
                      ))}
                    </>
                  )}

                  {/* List invitations section */}
                  {invites.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider px-4 pt-3 pb-1 font-semibold"
                        style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                        {t('notifInvites')}
                      </p>
                      {invites.map(inv => (
                        <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80 cursor-pointer"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                          onClick={() => void markInviteRead(inv.id, inv.listId)}>
                          <AvatarDisplay
                            user={{ username: inv.ownerUsername, avatarColor: inv.ownerAvatarColor, avatarImage: inv.ownerAvatarImage }}
                            size={30}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                              {t('notifInvitedBy').replace('{name}', inv.ownerUsername).replace('{title}', inv.listTitle)}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                              {timeAgo(inv.createdAt, lang)}
                            </p>
                          </div>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                        </div>
                      ))}
                    </>
                  )}
                  {/* Admin section */}
                  {pendingAdmin > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider px-4 pt-3 pb-1 font-semibold"
                        style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                        管理员
                      </p>
                      <div
                        className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80 cursor-pointer"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                        onClick={() => { setOpen(false); navigate('/admin') }}
                      >
                        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
                          <ShieldAlert size={14} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {pendingAdmin} 条待审邀请申请
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text)', opacity: 0.4 }}>前往管理员后台</p>
                        </div>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
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
