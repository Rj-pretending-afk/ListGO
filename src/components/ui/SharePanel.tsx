import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useT } from '../../hooks/useLang'
import { userApi, friendApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'
import { AvatarDisplay } from './AvatarDisplay'
import type { List, ListPermission } from '../../types/list.types'
import type { FriendInfo } from '../../types/user.types'

interface SharePanelProps {
  list: List
  onPermissionChange: (permission: ListPermission) => void
  onInvitedUsersChange: (usernames: string[]) => void
  onClose: () => void
}

const PERMISSIONS: { value: ListPermission; labelKey: 'permPublic' | 'permLoggedIn' | 'permInvited' | 'permFriendsOnly' | 'permInvitedFriends' | 'permPrivate' }[] = [
  { value: 'public',               labelKey: 'permPublic' },
  { value: 'verified',             labelKey: 'permLoggedIn' },
  { value: 'invite_only',          labelKey: 'permInvited' },
  { value: 'friends-only',         labelKey: 'permFriendsOnly' },
  { value: 'invite_only_friends',  labelKey: 'permInvitedFriends' },
  { value: 'private',              labelKey: 'permPrivate' },
]

export function SharePanel({ list, onPermissionChange, onInvitedUsersChange, onClose }: SharePanelProps) {
  const t = useT()
  const currentUser = useAuthStore(s => s.user)
  const [copied, setCopied] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [suggestions, setSuggestions] = useState<{ username: string; displayName: string }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Friends list for invite_only_friends mode
  const [friends, setFriends] = useState<FriendInfo[]>([])
  const [friendSearch, setFriendSearch] = useState('')

  useEffect(() => {
    if (list.permission !== 'invite_only_friends' || !currentUser) return
    friendApi.list().then(setFriends).catch(() => {})
  }, [list.permission, currentUser])

  const invited = list.invitedUsernames ?? []

  useEffect(() => {
    if (list.permission !== 'invite_only') return
    if (inviteInput.length < 1) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await userApi.search(inviteInput)
        setSuggestions(res.filter(u => !invited.includes(u.username)))
      } catch {
        setSuggestions([])
      }
    }, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteInput, list.permission])

  const addUser = (username: string) => {
    if (!invited.includes(username)) {
      onInvitedUsersChange([...invited, username])
    }
    setInviteInput('')
    setSuggestions([])
    setFriendSearch('')
  }

  const removeUser = (username: string) => {
    onInvitedUsersChange(invited.filter(u => u !== username))
  }

  const shareUrl = `${window.location.origin}/l/${list.id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Filtered friends for invite_only_friends
  const filteredFriends = friends.filter(f => {
    if (invited.includes(f.username)) return false
    if (!friendSearch) return true
    const q = friendSearch.toLowerCase()
    return f.username.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q)
  })

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      {/* Panel */}
      <div
        className="absolute right-0 top-full mt-1 z-40 rounded-xl shadow-xl p-4 w-72 space-y-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {t('shareSettings')}
          </span>
          <button
            onClick={onClose}
            className="text-xs hover:opacity-60 transition-opacity"
            style={{ color: 'var(--color-text)', opacity: 0.4 }}
          >
            {t('shareClose')}
          </button>
        </div>

        {/* Copy link */}
        <div className="space-y-1.5">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', opacity: 0.7 }}
          >
            <span className="flex-1 truncate font-mono">{shareUrl}</span>
          </div>
          <button
            onClick={copyLink}
            className="w-full py-1.5 rounded-lg text-sm font-medium btn-primary hover:opacity-80"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {copied ? t('shareLinkCopied') : t('shareCopyLink')}
          </button>
        </div>

        {/* Permission */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
            {t('sharePermission')}
          </div>
          <div className="space-y-1">
            {PERMISSIONS.map(({ value, labelKey }) => {
              const active = list.permission === value
              return (
                <button
                  key={value}
                  onClick={() => onPermissionChange(value)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
                  style={{
                    backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--color-text)',
                    border: `1px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Invite users — shown for invite_only */}
        {list.permission === 'invite_only' && (
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              {t('inviteSection')}
            </div>

            {/* Current invitees */}
            {invited.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {invited.map(u => (
                  <span
                    key={u}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {u}
                    <button onClick={() => removeUser(u)} className="hover:opacity-60">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && suggestions.length > 0) addUser(suggestions[0].username)
                }}
                placeholder={t('friendSearch')}
                className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  border: '1px solid transparent',
                }}
              />
              {suggestions.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden shadow-lg z-50"
                  style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                >
                  {suggestions.map(s => (
                    <button
                      key={s.username}
                      onClick={() => addUser(s.username)}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span className="font-medium">{s.username}</span>
                      {s.displayName !== s.username && (
                        <span style={{ opacity: 0.5 }}> · {s.displayName}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invite friends — shown for invite_only_friends */}
        {list.permission === 'invite_only_friends' && (
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              {t('inviteFriendsSection')}
            </div>

            {/* Current invitees */}
            {invited.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {invited.map(u => (
                  <span
                    key={u}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {u}
                    <button onClick={() => removeUser(u)} className="hover:opacity-60">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Friend search input */}
            <input
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              placeholder={t('friendSearch')}
              className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-border)',
                color: 'var(--color-text)',
                border: '1px solid transparent',
              }}
            />

            {/* Friends list */}
            {filteredFriends.length > 0 && (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
              >
                {filteredFriends.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <AvatarDisplay
                      user={{ username: f.username, avatarColor: f.avatarColor, avatarImage: f.avatarImage }}
                      size={24}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {f.displayName}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                        @{f.username}
                      </p>
                    </div>
                    <button
                      onClick={() => addUser(f.username)}
                      className="text-xs px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
