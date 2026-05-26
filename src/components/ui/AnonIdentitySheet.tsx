import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AVATAR_COLORS } from '../../lib/colors'
import { setAnonIdentity, getAnonDisplayName } from '../../lib/anonIdentity'
import type { AnonIdentity } from '../../lib/anonIdentity'

interface AnonIdentitySheetProps {
  initial: AnonIdentity
  onDone: (identity: AnonIdentity) => void
}

export function AnonIdentitySheet({ initial, onDone }: AnonIdentitySheetProps) {
  const [color, setColor] = useState(initial.color)
  const [nickname, setNickname] = useState(initial.nickname)

  const confirm = (nick: string) => {
    const identity: AnonIdentity = { color, nickname: nick.trim() }
    setAnonIdentity(identity)
    onDone(identity)
  }

  const displayName = getAnonDisplayName({ color, nickname })

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>选个头像色</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
            匿名访问 · 其他人会看到这个颜色
          </p>
        </div>

        {/* Color picker */}
        <div className="flex gap-3 justify-center">
          {AVATAR_COLORS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setColor(value)}
              title={label}
              className="w-9 h-9 rounded-full transition-transform hover:scale-110 flex-shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: value,
                outline: color === value ? '3px solid var(--color-text)' : 'none',
                outlineOffset: '2px',
              }}
            >
              {color === value && <span className="text-white text-xs font-bold select-none">✓</span>}
            </button>
          ))}
        </div>

        {/* Nickname */}
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && confirm(nickname)}
          placeholder="昵称（可选）"
          maxLength={20}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }}
        />

        {/* Preview */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
            style={{ backgroundColor: color, fontSize: 16 }}
          >
            {nickname.trim() ? nickname.trim()[0].toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{displayName}</p>
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>预览效果</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => confirm('')}
            className="flex-1 py-2 rounded-lg text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)', opacity: 0.5, border: '1px solid var(--color-border)' }}
          >
            跳过
          </button>
          <button
            onClick={() => confirm(nickname)}
            className="flex-1 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            进入清单
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
