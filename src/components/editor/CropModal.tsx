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
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent) => {
    const r = imgRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e)
    setDragStart(pos)
    setBox({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return
    const pos = getPos(e)
    setBox({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      w: Math.abs(pos.x - dragStart.x),
      h: Math.abs(pos.y - dragStart.y),
    })
  }

  const handleMouseUp = () => setDragStart(null)

  const handleConfirm = () => {
    if (!box || box.w < 4 || box.h < 4 || !imgRef.current) return
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.clientWidth
    const scaleY = img.naturalHeight / img.clientHeight
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(box.w * scaleX)
    canvas.height = Math.round(box.h * scaleY)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, box.x * scaleX, box.y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
    onConfirm(canvas.toDataURL('image/jpeg', 0.92))
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
            <img
              ref={imgRef}
              src={src}
              className="w-full block object-contain"
              style={{ maxHeight: '60vh' }}
              draggable={false}
            />
            {valid && (
              <>
                {/* Dark overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                {/* Crop window cuts through overlay via box-shadow */}
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
