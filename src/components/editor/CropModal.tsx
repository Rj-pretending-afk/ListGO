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

  // useRef instead of useState so mousemove handler always reads fresh value (no stale closure)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent) => {
    const r = imgRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e)
    dragStartRef.current = pos
    setBox({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return
    const pos = getPos(e)
    const ds = dragStartRef.current
    setBox({
      x: Math.min(ds.x, pos.x),
      y: Math.min(ds.y, pos.y),
      w: Math.abs(pos.x - ds.x),
      h: Math.abs(pos.y - ds.y),
    })
  }

  const handleMouseUp = () => { dragStartRef.current = null }

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
      // CORS restriction on external URLs — just close
      onClose()
    }
  }

  const valid = box && box.w >= 4 && box.h >= 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative z-10 rounded-2xl overflow-hidden w-full max-w-2xl"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        <div className="p-4">
          <p className="text-sm mb-3 font-medium" style={{ color: 'var(--color-text)' }}>
            拖动选择裁剪区域
          </p>
          <div
            className="relative select-none cursor-crosshair overflow-hidden rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* max-width+height:auto (no object-fit) — clientWidth/Height equals real rendered pixels */}
            <img
              ref={imgRef}
              src={src}
              crossOrigin="anonymous"
              style={{ maxWidth: '100%', maxHeight: '60vh', height: 'auto', display: 'block' }}
              draggable={false}
            />
            {valid && (
              <>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: box!.x, top: box!.y, width: box!.w, height: box!.h,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    border: '2px solid white',
                    backgroundColor: 'transparent',
                  }}
                />
              </>
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
  )
}
