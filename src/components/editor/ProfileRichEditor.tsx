import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, Link } from 'lucide-react'
import DOMPurify from 'dompurify'
import { RichTextEditor, type RichTextEditorRef } from './RichTextEditor'
import { ImageResizeOverlay } from './ImageResizeOverlay'
import { CropModal } from './CropModal'
import { resizeDataUrl } from '../../lib/imageUtils'
import { uploadApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'

interface ProfileRichEditorProps {
  value: string
  onChange: (html: string) => void
  minHeight?: number
  placeholder?: string
}

function hasImage(html: string) {
  return /<img/i.test(html)
}

export function ProfileRichEditor({ value, onChange, minHeight = 60, placeholder }: ProfileRichEditorProps) {
  const { user } = useAuthStore()
  const editorRef = useRef<RichTextEditorRef>(null)
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)

  const imageAlreadyInserted = hasImage(value)

  const insertImageSrc = (src: string) => {
    if (imageAlreadyInserted) return // max one image
    const el = editorRef.current?.getEl()
    if (!el) return
    el.focus()
    const img = document.createElement('img')
    img.src = src
    img.style.cssText = 'max-width:100%;border-radius:6px;display:block;margin-top:6px'
    el.appendChild(img)
    onChange(DOMPurify.sanitize(el.innerHTML))
    setUrlOpen(false)
    setUrlInput('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (user) {
      setUploading(true)
      try { const { url } = await uploadApi.uploadImage(file); insertImageSrc(url) }
      catch { /* silent */ }
      finally { setUploading(false) }
    } else {
      const reader = new FileReader()
      reader.onload = async ev => {
        if (!ev.target?.result) return
        insertImageSrc(await resizeDataUrl(ev.target.result as string))
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasteImage = async (dataUrl: string) => {
    if (imageAlreadyInserted) return
    insertImageSrc(await resizeDataUrl(dataUrl))
  }

  const handleImageClick = (img: HTMLImageElement) => setSelectedImg(img)

  const syncContent = () => {
    const el = editorRef.current?.getEl()
    if (el) onChange(DOMPurify.sanitize(el.innerHTML))
  }

  const handleRemoveImg = () => {
    selectedImg?.remove()
    syncContent()
    setSelectedImg(null)
  }

  const handleCropConfirm = (dataUrl: string) => {
    if (!selectedImg) return
    selectedImg.src = dataUrl
    selectedImg.style.width = ''
    syncContent()
    setShowCrop(false)
    setSelectedImg(null)
  }

  const handleRestore = () => {
    if (!selectedImg?.dataset.originalSrc) return
    selectedImg.src = selectedImg.dataset.originalSrc
    delete selectedImg.dataset.originalSrc
    selectedImg.style.width = ''
    syncContent()
    setSelectedImg(null)
  }

  return (
    <div
      className="rounded-lg"
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
      onClick={() => setSelectedImg(null)}
    >
      {/* Text area */}
      <div className="px-3 py-2 relative">
        <RichTextEditor
          ref={editorRef}
          content={value}
          onChange={onChange}
          onImageClick={handleImageClick}
          onPasteImage={handlePasteImage}
          editorStyle={{ minHeight, fontSize: '0.875rem' }}
          placeholder=""
        />
        {!value && (
          <p className="pointer-events-none absolute top-2 left-3 text-sm select-none"
            style={{ color: 'var(--color-text)', opacity: 0.3 }}>
            {placeholder}
          </p>
        )}
      </div>

      {/* Image insert toolbar — hidden once an image is present */}
      {!imageAlreadyInserted && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 flex-wrap"
          style={{ borderTop: '1px solid var(--color-border)' }}
          onClick={e => e.stopPropagation()}
        >
          <label
            className="flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-70"
            style={{ color: 'var(--color-text)', opacity: uploading ? 0.35 : 0.5, pointerEvents: uploading ? 'none' : undefined }}
          >
            <ImagePlus size={12} /> {uploading ? '上传中…' : '添加图片'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button
            onClick={() => setUrlOpen(v => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70"
            style={{ color: 'var(--color-text)', opacity: 0.5 }}
          >
            <Link size={12} /> URL
          </button>
          {urlOpen && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                autoFocus
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.nativeEvent.isComposing) return
                  if (e.key === 'Enter') { if (urlInput.trim()) insertImageSrc(urlInput.trim()) }
                  if (e.key === 'Escape') { setUrlOpen(false); setUrlInput('') }
                }}
                placeholder="https://..."
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1 rounded"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              />
              <button
                onClick={() => { if (urlInput.trim()) insertImageSrc(urlInput.trim()) }}
                className="text-xs px-2 py-1 rounded font-medium hover:opacity-80 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >插入</button>
            </div>
          )}
        </div>
      )}

      {/* Image resize overlay */}
      {selectedImg && createPortal(
        <ImageResizeOverlay
          imgEl={selectedImg}
          onResizeEnd={syncContent}
          onCrop={() => {
            if (!selectedImg.dataset.originalSrc) selectedImg.dataset.originalSrc = selectedImg.src
            setShowCrop(true)
          }}
          onRemove={handleRemoveImg}
          onRestore={handleRestore}
        />,
        document.body
      )}

      {/* Crop modal */}
      {showCrop && selectedImg && createPortal(
        <CropModal
          src={selectedImg.src}
          onConfirm={handleCropConfirm}
          onClose={() => setShowCrop(false)}
        />,
        document.body
      )}
    </div>
  )
}
