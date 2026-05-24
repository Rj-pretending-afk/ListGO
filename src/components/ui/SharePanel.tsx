import { useState } from 'react'
import { useT } from '../../hooks/useLang'
import type { List, ListPermission } from '../../types/list.types'

interface SharePanelProps {
  list: List
  onPermissionChange: (permission: ListPermission) => void
  onClose: () => void
}

const PERMISSIONS: { value: ListPermission; labelKey: 'permPublic' | 'permLoggedIn' | 'permInvited' | 'permPrivate' }[] = [
  { value: 'public',      labelKey: 'permPublic' },
  { value: 'verified',    labelKey: 'permLoggedIn' },
  { value: 'invite_only', labelKey: 'permInvited' },
  { value: 'private',     labelKey: 'permPrivate' },
]

export function SharePanel({ list, onPermissionChange, onClose }: SharePanelProps) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/l/${list.id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
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
            className="w-full py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
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
      </div>
    </>
  )
}
