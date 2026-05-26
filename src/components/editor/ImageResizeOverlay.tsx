import { useState, useCallback, useEffect } from 'react'
import { useT } from '../../hooks/useLang'

interface ImageResizeOverlayProps {
  imgEl: HTMLImageElement
  onResizeEnd: () => void
  onCrop: () => void
  onRemove: () => void
  onRestore?: () => void
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

const HANDLE_SIZE = 10
const HALF = HANDLE_SIZE / 2

/** Direction multiplier: right-side corners grow when dragging right; left-side shrink */
const DIR: Record<Corner, 1 | -1> = { tr: 1, br: 1, tl: -1, bl: -1 }

/** CSS cursor for each corner */
const CURSOR: Record<Corner, string> = {
  tl: 'nwse-resize', br: 'nwse-resize',
  tr: 'nesw-resize', bl: 'nesw-resize',
}

export function ImageResizeOverlay({ imgEl, onResizeEnd, onCrop, onRemove, onRestore }: ImageResizeOverlayProps) {
  const t = useT()
  const [rect, setRect] = useState(() => imgEl.getBoundingClientRect())

  // Reposition when switching to a different image element
  useEffect(() => {
    setRect(imgEl.getBoundingClientRect())
  }, [imgEl])

  const refreshRect = useCallback(() => {
    setRect(imgEl.getBoundingClientRect())
  }, [imgEl])

  const startResize = (corner: Corner) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startW = imgEl.clientWidth

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) * DIR[corner]
      const newW = Math.max(40, startW + dx)
      imgEl.style.width = `${newW}px`
      // height: auto keeps natural aspect ratio via CSS — no explicit height needed
      imgEl.style.height = 'auto'
      refreshRect()
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      onResizeEnd()
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handles: { corner: Corner; top: number; left: number }[] = [
    { corner: 'tl', top: rect.top - HALF,    left: rect.left - HALF },
    { corner: 'tr', top: rect.top - HALF,    left: rect.right - HALF },
    { corner: 'bl', top: rect.bottom - HALF, left: rect.left - HALF },
    { corner: 'br', top: rect.bottom - HALF, left: rect.right - HALF },
  ]

  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  const hasOriginal = !!imgEl.dataset.originalSrc
  // Keep action bar visible within viewport; widen estimate when restore button is present
  const barWidth = hasOriginal ? 280 : 220
  const barTop = Math.min(window.innerHeight - 52, Math.max(4, rect.bottom + 6))
  const barLeft = Math.max(4, Math.min(window.innerWidth - barWidth, rect.left))

  return (
    <>
      {/* Selection border */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: rect.top, left: rect.left, width: rect.width, height: rect.height,
          border: '2px solid var(--color-primary)', zIndex: 40,
          boxSizing: 'border-box',
        }}
      />

      {/* Corner handles */}
      {handles.map(({ corner, top, left }) => (
        <div
          key={corner}
          className="fixed z-50"
          style={{
            top, left,
            width: HANDLE_SIZE, height: HANDLE_SIZE,
            backgroundColor: 'var(--color-primary)',
            border: '2px solid white',
            borderRadius: '2px',
            cursor: CURSOR[corner],
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
          onMouseDown={startResize(corner)}
          onClick={e => e.stopPropagation()}
        />
      ))}

      {/* Action bar — capped within viewport */}
      <div
        className="fixed z-50 flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs shadow-lg"
        style={{
          top: barTop,
          left: barLeft,
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <span style={{ color: 'var(--color-text)', opacity: 0.45 }}>
          {w} × {h}px
        </span>
        <button onClick={onCrop} className="hover:opacity-70" style={{ color: 'var(--color-text)' }}>{t('cropAction')}</button>
        {hasOriginal && (
          <button onClick={onRestore} className="hover:opacity-70" style={{ color: 'var(--color-primary)' }}>{t('restoreImg')}</button>
        )}
        <button onClick={onRemove} className="hover:opacity-70" style={{ color: '#ef4444' }}>{t('removeImg')}</button>
      </div>
    </>
  )
}
