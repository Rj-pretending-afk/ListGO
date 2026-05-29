import { useRef, useState } from 'react'
import { useT } from '../../hooks/useLang'

interface Box    { x: number; y: number; w: number; h: number }
interface Circle { cx: number; cy: number; r: number }

interface CropModalProps {
  src: string
  onConfirm: (dataUrl: string) => void | Promise<void>
  onClose: () => void
  shape?: 'rect' | 'circle'
}

const EDGE = 14 // px tolerance for edge-resize detection

export function CropModal({ src, onConfirm, onClose, shape = 'rect' }: CropModalProps) {
  const t = useT()
  const imgRef  = useRef<HTMLImageElement>(null)
  // Stable unique mask id so multiple portals don't conflict
  const maskId  = useRef(`ccm-${Math.random().toString(36).slice(2)}`)

  // ── rect mode ──
  const [box, setBox]             = useState<Box | null>(null)
  const rectStartRef              = useRef<{ x: number; y: number } | null>(null)

  // ── circle mode ──
  const [circle, setCircle]       = useState<Circle | null>(null)
  const [circleCursor, setCircleCursor] = useState('default')
  const circleDragRef             = useRef<{
    mode: 'move' | 'resize'
    startX: number; startY: number
    snap: Circle
  } | null>(null)

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

  const getPos = (clientX: number, clientY: number) => {
    const r = imgRef.current!.getBoundingClientRect()
    return { x: clamp(clientX - r.left, 0, r.width), y: clamp(clientY - r.top, 0, r.height) }
  }

  // Initialize circle once image layout is ready
  const initCircle = () => {
    requestAnimationFrame(() => {
      const img = imgRef.current
      if (!img || img.clientWidth === 0) return
      const r = Math.min(img.clientWidth, img.clientHeight) * 0.38
      setCircle({ cx: img.clientWidth / 2, cy: img.clientHeight / 2, r })
    })
  }

  // ── rect handlers ──
  const onRectDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!imgRef.current) return
    const pos = getPos(e.clientX, e.clientY)
    rectStartRef.current = pos
    setBox({ x: pos.x, y: pos.y, w: 0, h: 0 })
    const onMove = (me: MouseEvent) => {
      if (!rectStartRef.current) return
      const p = getPos(me.clientX, me.clientY)
      const ds = rectStartRef.current
      setBox({ x: Math.min(ds.x, p.x), y: Math.min(ds.y, p.y), w: Math.abs(p.x - ds.x), h: Math.abs(p.y - ds.y) })
    }
    const onUp = () => { rectStartRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── circle handlers ──
  const hitMode = (pos: { x: number; y: number }, c: Circle): 'move' | 'resize' | null => {
    const dist = Math.hypot(pos.x - c.cx, pos.y - c.cy)
    if (dist > c.r + EDGE) return null
    return Math.abs(dist - c.r) <= EDGE ? 'resize' : 'move'
  }

  const onCircleMove = (e: React.MouseEvent) => {
    if (!circle || circleDragRef.current) return
    const mode = hitMode(getPos(e.clientX, e.clientY), circle)
    setCircleCursor(mode === 'resize' ? 'ew-resize' : mode === 'move' ? 'move' : 'default')
  }

  const onCircleDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!circle || !imgRef.current) return
    const pos = getPos(e.clientX, e.clientY)
    const mode = hitMode(pos, circle)
    if (!mode) return
    circleDragRef.current = { mode, startX: pos.x, startY: pos.y, snap: { ...circle } }
    const { clientWidth: W, clientHeight: H } = imgRef.current
    const onMove = (me: MouseEvent) => {
      const p   = getPos(me.clientX, me.clientY)
      const { mode: m, startX, startY, snap } = circleDragRef.current!
      if (m === 'move') {
        setCircle({
          cx: clamp(snap.cx + p.x - startX, snap.r, W - snap.r),
          cy: clamp(snap.cy + p.y - startY, snap.r, H - snap.r),
          r: snap.r,
        })
      } else {
        const dist = Math.hypot(p.x - snap.cx, p.y - snap.cy)
        const maxR = Math.min(snap.cx, W - snap.cx, snap.cy, H - snap.cy)
        setCircle({ ...snap, r: clamp(dist, 20, maxR) })
      }
    }
    const onUp = () => {
      circleDragRef.current = null
      setCircleCursor('default')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── confirm ──
  const handleConfirm = () => {
    if (!imgRef.current) return
    try {
      const img    = imgRef.current
      const scaleX = img.naturalWidth  / img.clientWidth
      const scaleY = img.naturalHeight / img.clientHeight
      if (shape === 'circle' && circle) {
        const size = Math.round(circle.r * 2 * Math.min(scaleX, scaleY))
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')!
        ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
        ctx.drawImage(img,
          (circle.cx - circle.r) * scaleX, (circle.cy - circle.r) * scaleY,
          circle.r * 2 * scaleX, circle.r * 2 * scaleY,
          0, 0, size, size)
        onConfirm(canvas.toDataURL('image/png'))
      } else if (box && box.w >= 4 && box.h >= 4) {
        const canvas = document.createElement('canvas')
        canvas.width  = Math.max(1, Math.round(box.w * scaleX))
        canvas.height = Math.max(1, Math.round(box.h * scaleY))
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, box.x * scaleX, box.y * scaleY, box.w * scaleX, box.h * scaleY, 0, 0, canvas.width, canvas.height)
        onConfirm(canvas.toDataURL('image/jpeg', 0.92))
      }
    } catch { onClose() }
  }

  const valid = shape === 'circle' ? !!(circle && circle.r >= 10) : !!(box && box.w >= 4 && box.h >= 4)

  // Circle live preview calculation
  const circlePreview = (circle && imgRef.current && imgRef.current.clientWidth > 0)
    ? (() => {
        const W = imgRef.current!.clientWidth
        const H = imgRef.current!.clientHeight
        const scale = 48 / (circle.r * 2)
        return {
          backgroundImage: `url(${src})`,
          backgroundSize:    `${W * scale}px ${H * scale}px`,
          backgroundPosition: `-${(circle.cx - circle.r) * scale}px -${(circle.cy - circle.r) * scale}px`,
          backgroundRepeat: 'no-repeat' as const,
        }
      })()
    : null

  return (
    <div className="fixed inset-0 z-[500]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
        <div className="rounded-2xl overflow-hidden w-full max-w-2xl"
          style={{ pointerEvents: 'auto', backgroundColor: 'var(--color-card)' }}
          onClick={e => e.stopPropagation()}>
          <div className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {shape === 'circle'
                  ? t('cropCircleHint')
                  : valid
                    ? `${t('cropSelected')} ${Math.round(box!.w)} × ${Math.round(box!.h)} ${t('cropPxSuffix')}`
                    : t('cropDragHint')}
              </p>
              {shape === 'circle' && circlePreview && (
                <div className="flex-shrink-0 ml-4 rounded-full"
                  style={{ width: 48, height: 48, border: '2px solid var(--color-primary)', overflow: 'hidden', ...circlePreview }} />
              )}
            </div>

            {/* Image + overlay */}
            <div className="relative select-none rounded-lg overflow-hidden"
              style={{ cursor: shape === 'circle' ? circleCursor : 'crosshair' }}
              onMouseDown={shape === 'circle' ? onCircleDown : onRectDown}
              onMouseMove={shape === 'circle' ? onCircleMove : undefined}>
              <img ref={imgRef} src={src} crossOrigin="anonymous" draggable={false}
                style={{ maxWidth: '100%', maxHeight: '60vh', height: 'auto', display: 'block' }}
                onLoad={shape === 'circle' ? initCircle : undefined} />

              {/* Circle overlay — SVG mask */}
              {shape === 'circle' && circle && (
                <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <mask id={maskId.current}>
                      <rect width="100%" height="100%" fill="white" />
                      <circle cx={circle.cx} cy={circle.cy} r={circle.r} fill="black" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask={`url(#${maskId.current})`} />
                  <circle cx={circle.cx} cy={circle.cy} r={circle.r} fill="none" stroke="white" strokeWidth="2" />
                </svg>
              )}

              {/* Rect overlay */}
              {shape === 'rect' && valid && (
                <div className="absolute pointer-events-none"
                  style={{ left: box!.x, top: box!.y, width: box!.w, height: box!.h, outline: '2px solid white', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }} />
              )}
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg hover:opacity-70"
                style={{ color: 'var(--color-text)', opacity: 0.6 }}>{t('cropCancel')}</button>
              <button onClick={handleConfirm} disabled={!valid}
                className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-35 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>{t('cropConfirm')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
