import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from 'lucide-react'
import { resizeDataUrl } from '../../lib/imageUtils'
import { uploadApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'
import { useT } from '../../hooks/useLang'
import { MODULE_PRESET_COLORS } from '../../lib/i18n'
import type { ModuleBackground } from '../../types/list.types'

const DEFAULT_BG: ModuleBackground = { type: 'color', value: '', opacity: 0.85, size: 'cover', posX: 50, posY: 50 }

interface ModuleSettingsPickerProps {
  background?: ModuleBackground
  onBgChange: (bg: ModuleBackground | undefined) => void
}

export function ModuleSettingsPicker({ background, onBgChange }: ModuleSettingsPickerProps) {
  const t = useT()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const [urlInput, setUrlInput] = useState('')
  const [bgUploading, setBgUploading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const bg = background ?? DEFAULT_BG
  const hasBg = background && (background.imageData || (background.type === 'color' && background.value))

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
      const panelW = 18 * rem
      const panelMaxH = Math.min(window.innerHeight * 0.82, 600)
      const top = Math.max(8, Math.min(r.bottom + 4, window.innerHeight - panelMaxH - 8))
      const left = Math.max(8, Math.min(r.right - panelW, window.innerWidth - panelW - 8))
      setPanelPos({ top, left })
    }
    setOpen(v => !v)
  }

  const updateBg = (patch: Partial<ModuleBackground>) => onBgChange({ ...bg, ...patch })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (user) {
      // Registered user: upload to R2
      setBgUploading(true)
      try {
        const { url } = await uploadApi.uploadImage(file)
        updateBg({ type: 'image', imageData: url })
      } catch { /* ignore */ }
      finally { setBgUploading(false) }
    } else {
      // Anonymous: embed as base64
      const reader = new FileReader()
      reader.onload = async ev => {
        if (!ev.target?.result) return
        const resized = await resizeDataUrl(ev.target.result as string)
        updateBg({ type: 'image', imageData: resized })
      }
      reader.readAsDataURL(file)
    }
  }

  const panel = (
    <>
      <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
      <div className="fixed z-[201] rounded-xl shadow-2xl overflow-y-auto"
        style={{ top: panelPos.top, left: panelPos.left, width: '18rem', maxHeight: '82vh', backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('moduleSettings')}</span>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}><X size={14} /></button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text)', opacity: 0.55 }}>{t('background')}</p>
              {hasBg && (
                <button onClick={() => onBgChange(undefined)} className="text-xs hover:opacity-70" style={{ color: '#ef4444' }}>{t('clearBg')}</button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-3">
              {MODULE_PRESET_COLORS.map(({ key, value }) => (
                <button key={key} onClick={() => updateBg({ type: 'color', value })} title={t(key)}
                  className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: value || undefined,
                    borderColor: bg.type === 'color' && bg.value === value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundImage: !value ? 'linear-gradient(135deg,#ccc 25%,transparent 25%),linear-gradient(225deg,#ccc 25%,transparent 25%),linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(315deg,#ccc 25%,transparent 25%)' : undefined,
                    backgroundSize: !value ? '8px 8px' : undefined,
                  }} />
              ))}
              <label className="w-10 h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-all relative overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{t('customColorBtn')}</span>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => updateBg({ type: 'color', value: e.target.value })} />
              </label>
            </div>

            <label
              className="block text-xs px-2 py-1.5 rounded-lg text-center cursor-pointer hover:opacity-80 mb-2"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: bgUploading ? 0.6 : 1, pointerEvents: bgUploading ? 'none' : undefined }}
            >
              {bgUploading ? '上传中…' : t('uploadBg')}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={bgUploading} />
            </label>

            <div className="flex gap-2 mb-3">
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder={t('pasteUrl')}
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1.5 rounded-lg"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
              <button onClick={() => { if (urlInput.trim()) updateBg({ type: 'image', imageData: urlInput.trim() }) }}
                className="px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>{t('apply')}</button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                {t('opacity')} <span style={{ color: 'var(--color-primary)' }}>{Math.round(bg.opacity * 100)}%</span>
                <input type="range" min={0.05} max={1} step={0.05} value={bg.opacity}
                  onChange={e => updateBg({ opacity: Number(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)]" />
              </label>

              {bg.type === 'image' && bg.imageData && (
                <>
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                    {t('imageSize')} <span style={{ color: 'var(--color-primary)' }}>{bg.sizePercent ?? 100}%</span>
                    <input type="range" min={10} max={300} step={5} value={bg.sizePercent ?? 100}
                      onChange={e => updateBg({ sizePercent: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]" />
                  </label>
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                    {t('posX')} <span style={{ color: 'var(--color-primary)' }}>{bg.posX ?? 50}%</span>
                    <input type="range" min={0} max={100} step={1} value={bg.posX ?? 50}
                      onChange={e => updateBg({ posX: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]" />
                  </label>
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                    {t('posY')} <span style={{ color: 'var(--color-primary)' }}>{bg.posY ?? 50}%</span>
                    <input type="range" min={0} max={100} step={1} value={bg.posY ?? 50}
                      onChange={e => updateBg({ posY: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]" />
                  </label>
                </>
              )}

              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                <span>{t('fillMode')}</span>
                {(['cover', 'contain', 'auto'] as const).map(s => (
                  <button key={s} onClick={() => updateBg({ size: s, sizePercent: undefined })}
                    className="px-2 py-0.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: bg.size === s && !bg.sizePercent ? 'var(--color-primary)' : 'var(--color-border)', color: bg.size === s && !bg.sizePercent ? 'white' : 'var(--color-text)' }}>
                    {s === 'cover' ? t('fillCover') : s === 'contain' ? t('fillContain') : t('fillOriginal')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="relative flex-shrink-0">
      <button ref={btnRef} onClick={handleOpen}
        className="p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: hasBg ? 0.8 : 0.3 }}
        title={t('moduleSettings')}>
        <Settings size={14} />
      </button>
      {open && createPortal(panel, document.body)}
    </div>
  )
}
