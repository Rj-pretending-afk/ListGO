import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Palette, Lock } from 'lucide-react'
import { useTheme, getStyle, getMode, STYLE_META, type StyleTheme } from '../../hooks/useTheme'
import { useAuthStore } from '../../hooks/useAuth'
import { api } from '../../lib/api'

export function StylePicker() {
  const { theme, setStyle } = useTheme()
  const user = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const currentStyle = getStyle(theme)
  const currentMode = getMode(theme)

  const handleSelect = async (style: StyleTheme) => {
    if (!user) return
    setOpen(false)
    setStyle(style)
    const newTheme = `${style}-${currentMode}`
    updateUser({ theme: newTheme })
    try { await api.put('/auth/profile', { theme: newTheme }) } catch { /* ignore */ }
  }

  const rect = btnRef.current?.getBoundingClientRect()

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
        title="切换风格"
        aria-label="切换风格"
        style={{ color: 'var(--color-text)' }}
      >
        <Palette size={16} />
      </button>

      {open && rect && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[301] rounded-xl p-2"
            style={{
              top: rect.bottom + 6,
              left: Math.min(rect.left, document.documentElement.clientWidth - 220),
              width: 210,
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {!user && (
              <p className="text-xs px-2 pb-1.5 pt-0.5" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                登录后可同步风格
              </p>
            )}
            {(Object.entries(STYLE_META) as [StyleTheme, typeof STYLE_META[StyleTheme]][]).map(([id, meta]) => {
              const preview = meta.preview[currentMode]
              const active = currentStyle === id
              const locked = !user

              return (
                <button
                  key={id}
                  onClick={() => void handleSelect(id)}
                  disabled={locked}
                  title={locked ? '登录后使用' : undefined}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left w-full transition-all relative"
                  style={{
                    border: active && !locked ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                    backgroundColor: active && !locked
                      ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                      : 'transparent',
                    opacity: locked ? 0.45 : 1,
                    cursor: locked ? 'not-allowed' : 'pointer',
                  }}
                >
                  {/* Color swatch */}
                  <div
                    className="flex-shrink-0 rounded overflow-hidden flex"
                    style={{ width: 32, height: 20, border: '1px solid rgba(128,128,128,0.2)' }}
                  >
                    <div style={{ flex: 1, background: preview[0] }} />
                    <div style={{ width: 8, background: preview[2] }} />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-xs leading-tight"
                      style={{ color: 'var(--color-text)', fontWeight: active && !locked ? 600 : 400 }}
                    >
                      {meta.nameEn}
                    </span>
                    <span
                      className="text-xs leading-tight"
                      style={{ color: 'var(--color-text)', opacity: 0.5 }}
                    >
                      {meta.name}
                    </span>
                  </div>

                  {locked && (
                    <Lock size={11} className="flex-shrink-0" style={{ color: 'var(--color-text)', opacity: 0.5 }} />
                  )}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
