import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShieldAlert, Check, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { notificationApi, friendApi } from '../../lib/api'
import { AvatarDisplay } from '../ui/AvatarDisplay'
import { ProfileCard } from '../ui/ProfileCard'
import { useT } from '../../hooks/useLang'
import { useLangStore } from '../../hooks/useLang'
import type { PokeInfo, ListInvitationNotif, FriendRequest } from '../../types/user.types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

function timeAgo(ts: number, lang: string) {
  return formatDistanceToNow(ts, { locale: lang === 'zh' ? zhCN : undefined, addSuffix: true })
}

function stripHtml(html: string): string {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent ?? ''
}

export function NotificationBell() {
  const t = useT()
  const lang = useLangStore(s => s.lang)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pokes, setPokes] = useState<PokeInfo[]>([])
  const [invites, setInvites] = useState<ListInvitationNotif[]>([])
  const [friendReqs, setFriendReqs] = useState<FriendRequest[]>([])
  const [pendingAdmin, setPendingAdmin] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profileCard, setProfileCard] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const totalUnread = pokes.length + invites.length + friendReqs.length + pendingAdmin

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationApi.getAll()
      setPokes(data.pokes)
      setInvites(data.listInvitations)
      setFriendReqs(data.friendRequests ?? [])
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
    // Backend auto-sends reader's poke_message back to the poker on mark-read
    await notificationApi.markPokeRead(p.id).catch(() => undefined)
    setPokes(prev => prev.filter(item => item.id !== p.id))
    setProfileCard(p.senderUsername)
  }

  const markInviteRead = async (id: string, listId: string) => {
    await notificationApi.markInvitationRead(id).catch(() => undefined)
    setInvites(prev => prev.filter(i => i.id !== id))
    setOpen(false)
    navigate(`/list/${listId}`)
  }

  const acceptFriendReq = async (id: string) => {
    await friendApi.accept(id).catch(() => undefined)
    setFriendReqs(prev => prev.filter(r => r.id !== id))
  }

  const rejectFriendReq = async (id: string) => {
    await friendApi.remove(id).catch(() => undefined)
    setFriendReqs(prev => prev.filter(r => r.id !== id))
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
              {loading && pokes.length === 0 && invites.length === 0 && friendReqs.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--color-text)', opacity: 0.4 }}>{t('loading')}</p>
              ) : pokes.length === 0 && invites.length === 0 && friendReqs.length === 0 && pendingAdmin === 0 ? (
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
                              {(p.pokeMessageSnapshot ? t('notifPokeReply') : t('notifPokedBy')).replace('{name}', p.senderDisplayName)}
                            </p>
                            {p.pokeMessageSnapshot && (
                              <p className="text-[10px] italic truncate" style={{ color: 'var(--color-primary)' }}>
                                {stripHtml(p.pokeMessageSnapshot)}
                              </p>
                            )}
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
                  {/* Friend requests section */}
                  {friendReqs.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider px-4 pt-3 pb-1 font-semibold"
                        style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                        {t('notifFriendReqs')}
                      </p>
                      {friendReqs.map(r => (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-2.5"
                          style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <button className="flex-1 flex items-center gap-3 text-left hover:opacity-80"
                            onClick={() => setProfileCard(r.requesterUsername)}>
                            <AvatarDisplay
                              user={{ username: r.requesterUsername, avatarColor: r.requesterAvatarColor, avatarImage: r.requesterAvatarImage }}
                              size={30}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                {t('notifFriendReqBy').replace('{name}', r.requesterDisplayName)}
                              </p>
                              <p className="text-[10px]" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                                {timeAgo(r.createdAt, lang)}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => void acceptFriendReq(r.id)}
                              className="p-1.5 rounded-lg hover:opacity-70"
                              style={{ color: 'var(--color-primary)' }}
                              title={t('friendAccept')}
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => void rejectFriendReq(r.id)}
                              className="p-1.5 rounded-lg hover:opacity-70"
                              style={{ color: 'var(--color-text)', opacity: 0.4 }}
                              title={t('friendReject')}
                            >
                              <X size={13} />
                            </button>
                          </div>
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
