import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Zap, UserMinus, Check, X, Search } from 'lucide-react'
import { friendApi, pokeApi, userApi } from '../lib/api'
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

export default function FriendsPage() {
  const t = useT()
  const lang = useLangStore(s => s.lang)
  const user = useAuthStore(s => s.user)

  const [tab, setTab] = useState<'friends' | 'requests'>('friends')
  const [friends, setFriends] = useState<FriendInfo[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Add friend search
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; displayName: string }[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set())

  // Poke state per friend
  const [pokeStates, setPokeStates] = useState<Record<string, 'idle' | 'sent' | 'error'>>({})

  // Profile card
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

  if (!user) {
    return (
      <div className="text-center py-24 text-sm" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
        请先登录
      </div>
    )
  }

  const pendingCount = requests.length

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('friendsTitle')}</h1>
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
          placeholder="搜索用户名…"
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
                <AvatarDisplay user={{ username: r.username, avatarColor: '#10B981' }} size={32} />
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
          <div className="space-y-2">
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
                  <button
                    onClick={() => void removeFriend(f.id)}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    title={t('friendRemove')}
                    style={{ color: 'var(--color-text)', opacity: 0.35 }}
                  >
                    <UserMinus size={14} />
                  </button>
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
