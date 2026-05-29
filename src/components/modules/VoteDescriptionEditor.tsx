import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, Link } from 'lucide-react'
import DOMPurify from 'dompurify'
import { BubbleToolbar } from '../editor/BubbleToolbar'
import { RichTextEditor, type RichTextEditorRef } from '../editor/RichTextEditor'
import { ImageResizeOverlay } from '../editor/ImageResizeOverlay'
import { CropModal } from '../editor/CropModal'
import { resizeDataUrl } from '../../lib/imageUtils'
import { uploadApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'
import { useT } from '../../hooks/useLang'
import { contentFontStyle } from '../../lib/contentFontStyle'
import type { ContentFontSettings } from '../../types/list.types'

interface VoteDescriptionEditorProps {
  value: string
  onChange: (html: string) => void
  canEdit: boolean
  contentFontSettings?: ContentFontSettings
  onClose?: () => void
  onActivate?: () => void  // called when this editor selects an image (clears opt overlay)
  clearKey?: number        // increment to force-clear selectedImg
}

export function VoteDescriptionEditor({
  value, onChange, canEdit, contentFontSettings, onClose, onActivate, clearKey,
}: VoteDescriptionEditorProps) {
  const t = useT()
  const { user } = useAuthStore()
  const editorRef = useRef<RichTextEditorRef>(null)
  const [selRect, setSelRect] = useState<DOMRect | null>(null)
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)

  // External signal to drop our selection (when opt-image overlay activates)
  useEffect(() => { if (clearKey !== undefined) setSelectedImg(null) }, [clearKey])
  const [showCrop, setShowCrop] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const editorStyle = contentFontStyle(contentFontSettings)

  const insertImageSrc = (src: string) => {
    const el = editorRef.current?.getEl()
    if (!el) return
    el.focus()
    const img = document.createElement('img')
    img.src = src
    img.style.cssText = 'max-width:100%;border-radius:6px;display:block;margin-top:6px'
    el.appendChild(img)
    onChange(DOMPurify.sanitize(el.innerHTML))
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

  const handleUrlInsert = () => {
    if (urlInput.trim()) insertImageSrc(urlInput.trim())
    setUrlInput(''); setUrlOpen(false)
  }

  const handleCropOpen = () => {
    if (selectedImg && !selectedImg.dataset.originalSrc)
      selectedImg.dataset.originalSrc = selectedImg.src
    setShowCrop(true)
  }

  const handleCropConfirm = (dataUrl: string) => {
    if (!selectedImg) return
    selectedImg.src = dataUrl; selectedImg.style.width = ''
    const el = editorRef.current?.getEl()
    if (el) onChange(DOMPurify.sanitize(el.innerHTML))
    setShowCrop(false); setSelectedImg(null)
  }

  const handleRestore = () => {
    if (!selectedImg?.dataset.originalSrc) return
    selectedImg.src = selectedImg.dataset.originalSrc
    delete selectedImg.dataset.originalSrc; selectedImg.style.width = ''
    const el = editorRef.current?.getEl()
    if (el) onChange(DOMPurify.sanitize(el.innerHTML))
    setSelectedImg(null)
  }

  const handleRemoveImg = () => {
    selectedImg?.remove()
    const el = editorRef.current?.getEl()
    if (el) onChange(DOMPurify.sanitize(el.innerHTML))
    setSelectedImg(null)
  }

  const toolbarStyle = selRect ? {
    position: 'fixed' as const,
    top: Math.max(4, selRect.top - 48),
    left: Math.min(window.innerWidth - 240, Math.max(4, selRect.left + selRect.width / 2 - 120)),
    zIndex: 50,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  } : null

  if (!canEdit) {
    if (!value) return null
    return (
      <div className="prose-sm max-w-none text-sm mb-3 pb-3"
        style={{ ...editorStyle, borderBottom: '1px solid var(--color-border)' }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
      />
    )
  }

  return (
    <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}
      onClick={() => setSelectedImg(null)}>
      <RichTextEditor
        ref={editorRef}
        content={value}
        onChange={onChange}
        onSelectionChange={setSelRect}
        onImageClick={img => { onActivate?.(); setSelectedImg(img); setSelRect(null) }}
        onPasteImage={async dataUrl => insertImageSrc(await resizeDataUrl(dataUrl))}
        editorStyle={editorStyle}
      />

      {selRect && toolbarStyle && (
        <div style={toolbarStyle}>
          <BubbleToolbar onFormat={(cmd, val) => editorRef.current?.applyFormat(cmd, val)} compact />
        </div>
      )}

      {selectedImg && createPortal(
        <ImageResizeOverlay
          imgEl={selectedImg}
          onResizeEnd={() => {
            const el = editorRef.current?.getEl()
            if (el) onChange(DOMPurify.sanitize(el.innerHTML))
          }}
          onCrop={handleCropOpen}
          onRemove={handleRemoveImg}
          onRestore={handleRestore}
        />,
        document.body
      )}

      {showCrop && selectedImg && createPortal(
        <CropModal src={selectedImg.src} onConfirm={handleCropConfirm} onClose={() => setShowCrop(false)} />,
        document.body
      )}

      <div className="flex items-center gap-2 mt-2 pt-2 flex-wrap"
        style={{ opacity: 0.75 }} onClick={e => e.stopPropagation()}>
        <label className="flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-70"
          style={{ color: 'var(--color-text)', opacity: uploading ? 0.35 : 0.55, pointerEvents: uploading ? 'none' : undefined }}>
          <ImagePlus size={13} /> {uploading ? '上传中…' : t('insertImage')}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
        <button onClick={() => setUrlOpen(v => !v)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70"
          style={{ color: 'var(--color-text)', opacity: 0.55 }}>
          <Link size={13} /> URL
        </button>
        {onClose && (
          <button onClick={onClose}
            className="ml-auto text-xs px-2 py-1 rounded hover:opacity-70"
            style={{ color: 'var(--color-text)', opacity: 0.4 }}>
            收起
          </button>
        )}
        {urlOpen && (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => {
                if (e.nativeEvent.isComposing) return
                if (e.key === 'Enter') handleUrlInsert()
                if (e.key === 'Escape') setUrlOpen(false)
              }}
              placeholder="https://..."
              className="flex-1 text-xs bg-transparent outline-none px-2 py-1 rounded"
              style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
            <button onClick={handleUrlInsert}
              className="text-xs px-2 py-1 rounded font-medium hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              插入
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
