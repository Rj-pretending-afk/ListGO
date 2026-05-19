import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import type { ListBackground as ListBackgroundType } from '../../types/list.types'
import { useT } from '../../hooks/useLang'
import { LIST_PRESET_COLORS } from '../../lib/i18n'

interface ListBackgroundProps {
  background: ListBackgroundType
  cardOpacity: number
  onChange: (bg: ListBackgroundType) => void
  onOpacityChange: (opacity: number) => void
}

export function ListBackground({ background, cardOpacity, onChange, onOpacityChange }: ListBackgroundProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [urlInput, setUrlInput] = useState(background.type === 'image' ? background.url : '')
  const currentColor = background.type === 'color' ? background.value : ''

  return (
    <div className="relative flex-shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs"
        style={{ color: 'var(--color-text)', opacity: 0.6 }}>
        <ImageIcon size={13} />{t('bgButton')}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 rounded-xl p-4 w-72 shadow-lg"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{t('bgSettings')}</span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text)', opacity: 0.4 }}><X size={14} /></button>
            </div>

            <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{t('bgColorLabel')}</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {LIST_PRESET_COLORS.map(({ key, value }) => (
                <button key={key} onClick={() => onChange({ type: 'color', value })} title={t(key)}
                  className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: value || undefined,
                    borderColor: currentColor === value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundImage: !value ? 'linear-gradient(135deg,#ccc 25%,transparent 25%),linear-gradient(225deg,#ccc 25%,transparent 25%),linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(315deg,#ccc 25%,transparent 25%)' : undefined,
                    backgroundSize: !value ? '8px 8px' : undefined,
                    backgroundPosition: !value ? '0 0,0 4px,4px -4px,-4px 0' : undefined,
                  }} />
              ))}
              <label className="w-10 h-10 rounded-lg border-2 overflow-hidden cursor-pointer hover:scale-110 transition-all flex items-center justify-center relative"
                style={{ borderColor: 'var(--color-border)' }} title={t('colorCustom')}>
                <span className="text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{t('customColorBtn')}</span>
                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => onChange({ type: 'color', value: e.target.value })} />
              </label>
            </div>

            <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{t('bgUrlLabel')}</p>
            <div className="flex gap-2 mb-4">
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..."
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1.5 rounded-lg"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
              <button onClick={() => { if (urlInput.trim()) onChange({ type: 'image', url: urlInput.trim() }); else onChange({ type: 'color', value: '' }) }}
                className="px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>{t('apply')}</button>
            </div>

            <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              {t('bgCardOpacity')} <span style={{ color: 'var(--color-primary)' }}>{Math.round(cardOpacity * 100)}%</span>
            </p>
            <input type="range" min={0.1} max={1} step={0.05} value={cardOpacity}
              onChange={e => onOpacityChange(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]" />
          </div>
        </>
      )}
    </div>
  )
}
