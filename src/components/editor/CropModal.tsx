import { useRef, useState } from 'react'
import { useT } from '../../hooks/useLang'

interface Box { x: number; y: number; w: number; h: number }

interface CropModalProps {
  src: string
  onConfirm: (dataUrl: string) => void
  onClose: () => void
  shape?: 'rect' | 'circle'
}

export function CropModal({ src, onConfirm, onClose, shape = 'rect' }: CropModalProps) {
  const t = useT()
  const imgRef = useRef<HTMLImageElement>(null)
  const [box, setBox] = useState<Box | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const getPos = (clientX: number, clientY: number) => {
    const r = imgRef.current!.getBoundingClientRect()
    return {
      x: clamp(clientX - r.left, 0, r.width),
      y: clamp(clientY - r.top, 0, r.height),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!imgRef.current) return
    const pos = getPos(e.clientX, e.clientY)
    dragStartRef.current = pos
    setBox({ x: pos.x, y: pos.y, w: 0, h: 0 })

    const onMove = (me: MouseEvent) => {
      if (!dragStartRef.current || !imgRef.current) return
      const p = getPos(me.clientX, me.clientY)
      const ds = dragStartRef.current
      if (shape === 'circle') {
        // Force square selection so the circle preview is accurate
        const rawW = Math.abs(p.x - ds.x)
        const rawH = Math.abs(p.y - ds.y)
        const size = Math.min(rawW, rawH)
        setBox({
          x: p.x < ds.x ? ds.x - size : ds.x,
          y: p.y < ds.y ? ds.y - size : ds.y,
          w: size,
          h: size,
        })
      } else {
        setBox({
          x: Math.min(ds.x, p.x),
          y: Math.min(ds.y, p.y),
          w: Math.abs(p.x - ds.x),
          h: Math.abs(p.y - ds.y),
        })
      }
    }

    const onUp = () => {
      dragStartRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleConfirm = () => {
    if (!box || box.w < 4 || box.h < 4 || !imgRef.current) return
    try {
      const img = imgRef.current
      const scaleX = img.naturalWidth / img.clientWidth
      const scaleY = img.naturalHeight / img.clientHeight
      const size = shape === 'circle' ? Math.min(box.w, box.h) : undefined
      const srcW = size ?? box.w
      const srcH = size ?? box.h
      const canvas = document.createElement('canvas')
      canvas.width  = Math.max(1, Math.round(srcW * scaleX))
      canvas.height = Math.max(1, Math.round(srcH * scaleY))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      if (shape === 'circle') {
        // Clip to circle before drawing
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
      }
      ctx.drawImage(img, box.x * scaleX, box.y * scaleY, srcW * scaleX, srcH * scaleY, 0, 0, canvas.width, canvas.height)
      onConfirm(canvas.toDataURL('image/png'))
    } catch {
      onClose()
    }
  }

  const valid = !!(box && box.w >= 4 && box.h >= 4)

  return (
    <div className="fixed inset-0 z-[500]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
        <div className="rounded-2xl overflow-hidden w-full max-w-2xl"
          style={{ pointerEvents: 'auto', backgroundColor: 'var(--color-card)' }}
          onClick={e => e.stopPropagation()}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {valid
                  ? `${t('cropSelected')} ${Math.round(box!.w)} × ${Math.round(box!.h)} ${t('cropPxSuffix')}`
                  : t('cropDragHint')}
              </p>
              {/* Circle preview of selection */}
              {shape === 'circle' && valid && (
                <div className="flex-shrink-0 ml-4"
                  style={{
                    width: 48, height: 48,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--color-primary)',
                    backgroundImage: `url(${src})`,
                    backgroundSize: `${(imgRef.current?.clientWidth ?? 1) / box!.w * 48}px`,
                    backgroundPosition: `-${box!.x / box!.w * 48}px -${box!.y / box!.h * 48}px`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )}
            </div>

            <div className="relative select-none cursor-crosshair rounded-lg overflow-hidden"
              onMouseDown={handleMouseDown}>
              <img ref={imgRef} src={src} crossOrigin="anonymous"
                style={{ maxWidth: '100%', maxHeight: '60vh', height: 'auto', display: 'block' }}
                draggable={false} />

              {valid && (
                <div className="absolute pointer-events-none"
                  style={{
                    left: box!.x, top: box!.y,
                    width: box!.w, height: box!.h,
                    outline: '2px solid white',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                    borderRadius: shape === 'circle' ? '50%' : undefined,
                  }} />
              )}
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg hover:opacity-70"
                style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                {t('cropCancel')}
              </button>
              <button onClick={handleConfirm} disabled={!valid}
                className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-35 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {t('cropConfirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
