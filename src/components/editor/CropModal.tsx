import { useRef, useState } from 'react'

interface Box { x: number; y: number; w: number; h: number }

interface CropModalProps {
  src: string
  onConfirm: (dataUrl: string) => void
  onClose: () => void
}

export function CropModal({ src, onConfirm, onClose }: CropModalProps) {
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

    // Use document-level listeners so mousemove/mouseup fire even outside the container.
    // This prevents the selection from being lost when the cursor leaves the image area.
    const onMove = (me: MouseEvent) => {
      if (!dragStartRef.current || !imgRef.current) return
      const p = getPos(me.clientX, me.clientY)
      const ds = dragStartRef.current
      setBox({
        x: Math.min(ds.x, p.x),
        y: Math.min(ds.y, p.y),
        w: Math.abs(p.x - ds.x),
        h: Math.abs(p.y - ds.y),
      })
    }

    const onUp = () => {
      dragStartRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      // box is intentionally kept — user sees the selection until they start a new one or confirm
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
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(box.w * scaleX))
      canvas.height = Math.max(1, Math.round(box.h * scaleY))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(
        img,
        box.x * scaleX, box.y * scaleY,
        box.w * scaleX, box.h * scaleY,
        0, 0, canvas.width, canvas.height
      )
      onConfirm(canvas.toDataURL('image/jpeg', 0.92))
    } catch {
      // e.g. cross-origin restriction
      onClose()
    }
  }

  const valid = !!(box && box.w >= 4 && box.h >= 4)

  return (
    <div className="fixed inset-0 z-[500]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Centering — pointer-events:none so clicks outside modal hit backdrop */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="rounded-2xl overflow-hidden w-full max-w-2xl"
          style={{ pointerEvents: 'auto', backgroundColor: 'var(--color-card)' }}
          onClick={e => e.stopPropagation()} // prevent bubbling to TextModule's dismiss handler
        >
          <div className="p-4">
            <p className="text-sm mb-3 font-medium" style={{ color: 'var(--color-text)' }}>
              {valid
                ? `已选择 ${Math.round(box!.w)} × ${Math.round(box!.h)} px — 点击确认裁剪`
                : '拖动选择裁剪区域'}
            </p>

            {/* Crop area — onMouseDown only, document handles move/up */}
            <div
              className="relative select-none cursor-crosshair rounded-lg overflow-hidden"
              onMouseDown={handleMouseDown}
            >
              <img
                ref={imgRef}
                src={src}
                crossOrigin="anonymous"
                style={{ maxWidth: '100%', maxHeight: '60vh', height: 'auto', display: 'block' }}
                draggable={false}
              />

              {/* Selection overlay: single div with box-shadow darkens area outside selection */}
              {valid && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: box!.x,
                    top: box!.y,
                    width: box!.w,
                    height: box!.h,
                    outline: '2px solid white',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                  }}
                />
              )}
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg hover:opacity-70"
                style={{ color: 'var(--color-text)', opacity: 0.6 }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!valid}
                className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-35 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                确认裁剪
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
