import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Zap, Check, X, Search, Share2, MoreHorizontal } from 'lucide-react'
import { friendApi, pokeApi, userApi, listApi } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { AvatarDisplay } from '../components/ui/AvatarDisplay'
import { ProfileCard } from '../components/ui/ProfileCard'
import { useT } from '../hooks/useLang'
import type { FriendInfo, FriendRequest } from '../types/user.types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLangStore } from '../hooks/useLang'

function timeAgo(ts: number, lang: string) {
  return formatDistanceToNow(ts, { locale: lang === 'zh' ? zhCN : undefined, addSuffix: true })
}

interface FriendsPageProps { asPanel?: boolean; onClose?: () => void; currentListId?: string }

export default function FriendsPage({ asPanel, onClose, currentListId }: FriendsPageProps = {}) {
  const t = useT()
  const lang = useLangStore(s => s.lang)
  const user = useAuthStore(s => s.user)

  const [tab, setTab] = useState<'friends' | 'requests'>('friends')
  const [friends, setFriends] = useState<FriendInfo[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Add friend search
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; displayName: string; avatarColor: string; avatarImage?: string }[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set())

  // Poke state per friend
  const [pokeStates, setPokeStates] = useState<Record<string, 'idle' | 'sent' | 'error'>>({})
  const [shareStates, setShareStates] = useState<Record<string, 'idle' | 'sent' | 'error'>>({})
  const [menuOpen, setMenuOpen] = useState<string | null>(null)       // friendId with open menu
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // friendId pending confirm
  const [profileCard, setProfileCard] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [fl, rl] = await Promise.all([friendApi.list(), friendApi.requests()])
      setFriends(fl)
      setRequests(rl)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetchAll() }, [fetchAll])

  // Search debounce
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return }
    const id = setTimeout(async () => {
      try { setSearchResults(await userApi.search(searchQ)) }
      catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(id)
  }, [searchQ])

  const sendRequest = async (id: string, username: string) => {
    setAddingId(username)
    try {
      await friendApi.sendRequest(id)
      setAddedSet(prev => new Set(prev).add(username))
    } catch { /* show nothing — user already friends etc */ }
    finally { setAddingId(null) }
  }

  const acceptRequest = async (id: string) => {
    await friendApi.accept(id).catch(() => undefined)
    setRequests(prev => prev.filter(r => r.id !== id))
    void fetchAll()
  }

  const rejectRequest = async (id: string) => {
    await friendApi.remove(id).catch(() => undefined)
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const removeFriend = async (id: string) => {
    await friendApi.remove(id).catch(() => undefined)
    setFriends(prev => prev.filter(f => f.id !== id))
  }

  const pokeFriend = async (friendUserId: string, friendId: string) => {
    if (pokeStates[friendId] === 'sent') return
    setPokeStates(prev => ({ ...prev, [friendId]: 'sent' }))
    try {
      await pokeApi.send(friendUserId)
    } catch {
      setPokeStates(prev => ({ ...prev, [friendId]: 'error' }))
      setTimeout(() => setPokeStates(prev => ({ ...prev, [friendId]: 'idle' })), 2000)
    }
    setTimeout(() => setPokeStates(prev => ({ ...prev, [friendId]: 'idle' })), 3000)
  }

  const shareList = async (friendUsername: string, friendId: string) => {
    if (!currentListId || shareStates[friendId] === 'sent') return
    setShareStates(prev => ({ ...prev, [friendId]: 'sent' }))
    try {
      await listApi.invite(currentListId, friendUsername)
    } catch {
      setShareStates(prev => ({ ...prev, [friendId]: 'error' }))
      setTimeout(() => setShareStates(prev => ({ ...prev, [friendId]: 'idle' })), 2000)
      return
    }
    setTimeout(() => setShareStates(prev => ({ ...prev, [friendId]: 'idle' })), 3000)
  }

  if (!user) {
    return (
      <div className="text-center py-24 text-sm" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
        {t('pleaseLogin')}
      </div>
    )
  }

  const pendingCount = requests.length

  return (
    <div className={asPanel ? 'px-4 py-5' : 'max-w-lg mx-auto px-4 py-10'}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('friendsTitle')}</h1>
        {asPanel && onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-60" style={{ color: 'var(--color-text)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl mb-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <Search size={14} style={{ color: 'var(--color-text)', opacity: 0.4 }} />
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder={t('friendSearch')}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--color-text)' }}
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}
        >
          {searchResults.map(r => (
            <div
              key={r.username}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setProfileCard(r.username)}>
                <AvatarDisplay user={{ username: r.username, avatarColor: r.avatarColor, avatarImage: r.avatarImage }} size={32} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{r.displayName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>@{r.username}</p>
                </div>
              </button>
              <button
                onClick={() => void sendRequest(r.id, r.username)}
                disabled={addingId === r.username || addedSet.has(r.username)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                <UserPlus size={12} />
                {addedSet.has(r.username) ? t('friendRequestSent') : t('friendAdd')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        {(['friends', 'requests'] as const).map(id => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all relative"
            style={{
              backgroundColor: tab === id ? 'var(--color-primary)' : 'transparent',
              color: tab === id ? 'white' : 'var(--color-text)',
              opacity: tab === id ? 1 : 0.6,
            }}
          >
            {id === 'friends' ? `${t('friendsTitle')} (${friends.length})` : t('friendsRequests')}
            {id === 'requests' && pendingCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
            {t('friendsEmpty')}
          </p>
        ) : (
          <div className="space-y-2" onClick={() => { setMenuOpen(null); setConfirmDelete(null) }}>
            {friends.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setProfileCard(f.username)}>
                  <AvatarDisplay
                    user={{ username: f.username, avatarColor: f.avatarColor, avatarImage: f.avatarImage }}
                    size={38}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{f.displayName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                      @{f.username} · {timeAgo(f.createdAt, lang)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => void pokeFriend(f.userId, f.id)}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    title="戳一戳"
                    style={{ color: pokeStates[f.id] === 'sent' ? 'var(--color-primary)' : 'var(--color-text)', opacity: pokeStates[f.id] === 'sent' ? 1 : 0.5 }}
                  >
                    <Zap size={15} />
                  </button>
                  {currentListId && (
                    <button
                      onClick={() => void shareList(f.username, f.id)}
                      className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                      title={shareStates[f.id] === 'sent' ? t('shareListSent') : t('shareListToFriend')}
                      style={{ color: shareStates[f.id] === 'sent' ? 'var(--color-primary)' : 'var(--color-text)', opacity: shareStates[f.id] === 'sent' ? 1 : 0.5 }}
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === f.id ? null : f.id); setConfirmDelete(null) }}
                      className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-text)', opacity: 0.35 }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {menuOpen === f.id && (
                      <div
                        className="absolute right-0 top-full mt-1 rounded-xl shadow-xl overflow-hidden z-50 min-w-[120px]"
                        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {confirmDelete === f.id ? (
                          <div className="px-3 py-2 space-y-1">
                            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{t('friendRemove')}？</p>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => { void removeFriend(f.id); setMenuOpen(null); setConfirmDelete(null) }}
                                className="flex-1 py-1 rounded-lg text-xs font-medium"
                                style={{ backgroundColor: '#ef4444', color: 'white' }}
                              >{t('confirmDelete')}</button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-1 rounded-lg text-xs"
                                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                              >{t('cancel')}</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(f.id)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:opacity-70"
                            style={{ color: '#ef4444' }}
                          >{t('friendRemove')}</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
            {t('friendsRequestsEmpty')}
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map(r => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setProfileCard(r.requesterUsername)}>
                  <AvatarDisplay
                    user={{ username: r.requesterUsername, avatarColor: r.requesterAvatarColor, avatarImage: r.requesterAvatarImage }}
                    size={38}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{r.requesterDisplayName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                      @{r.requesterUsername} · {timeAgo(r.createdAt, lang)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => void acceptRequest(r.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    <Check size={12} />
                    {t('friendAccept')}
                  </button>
                  <button
                    onClick={() => void rejectRequest(r.id)}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--color-text)', opacity: 0.4 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {profileCard && (
        <ProfileCard username={profileCard} onClose={() => setProfileCard(null)} />
      )}
    </div>
  )
}
