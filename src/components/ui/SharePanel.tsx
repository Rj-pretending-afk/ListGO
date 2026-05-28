import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useT } from '../../hooks/useLang'
import { userApi } from '../../lib/api'
import type { List, ListPermission } from '../../types/list.types'

interface SharePanelProps {
  list: List
  onPermissionChange: (permission: ListPermission) => void
  onInvitedUsersChange: (usernames: string[]) => void
  onClose: () => void
}

const PERMISSIONS: { value: ListPermission; labelKey: 'permPublic' | 'permLoggedIn' | 'permInvited' | 'permFriendsOnly' | 'permPrivate' }[] = [
  { value: 'public',        labelKey: 'permPublic' },
  { value: 'verified',      labelKey: 'permLoggedIn' },
  { value: 'invite_only',   labelKey: 'permInvited' },
  { value: 'friends-only',  labelKey: 'permFriendsOnly' },
  { value: 'private',       labelKey: 'permPrivate' },
]

export function SharePanel({ list, onPermissionChange, onInvitedUsersChange, onClose }: SharePanelProps) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [suggestions, setSuggestions] = useState<{ username: string; displayName: string }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const invited = list.invitedUsernames ?? []

  useEffect(() => {
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
  }, [inviteInput])

  const addUser = (username: string) => {
    if (!invited.includes(username)) {
      onInvitedUsersChange([...invited, username])
    }
    setInviteInput('')
    setSuggestions([])
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

        {/* Invite users — only shown for invite_only */}
        {list.permission === 'invite_only' && (
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              受邀用户
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
                placeholder="搜索用户名…"
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
      </div>
    </>
  )
}
