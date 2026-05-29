import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, Link } from 'lucide-react'
import { useT } from '../../hooks/useLang'
import { contentFontStyle } from '../../lib/contentFontStyle'
import type { ContentFontSettings } from '../../types/list.types'
import DOMPurify from 'dompurify'
import { BubbleToolbar } from '../editor/BubbleToolbar'
import { RichTextEditor, type RichTextEditorRef } from '../editor/RichTextEditor'
import { ImageResizeOverlay } from '../editor/ImageResizeOverlay'
import { CropModal } from '../editor/CropModal'
import { resizeDataUrl } from '../../lib/imageUtils'
import { uploadApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'
import type { TextModule as TextModuleType } from '../../types/list.types'

interface TextModuleProps {
  module: TextModuleType
  onChange: (module: TextModuleType) => void
  contentFontSettings?: ContentFontSettings
  canEdit?: boolean
}

export function TextModule({ module, onChange, contentFontSettings, canEdit = true }: TextModuleProps) {
  const t = useT()
  const { user } = useAuthStore()
  const editorRef = useRef<RichTextEditorRef>(null)
  const [selRect, setSelRect] = useState<DOMRect | null>(null)
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const originalQuality = module.originalQuality ?? false

  const applyFormat = (cmd: string, value?: string) => editorRef.current?.applyFormat(cmd, value)
  const handleContentChange = (html: string) => onChange({ ...module, content: html })

  const editorStyle: React.CSSProperties = {
    ...(module.fontSettings?.size ? { fontSize: module.fontSettings.size } : {}),
    ...(module.fontSettings?.family ? { fontFamily: module.fontSettings.family } : {}),
    ...(module.fontSettings?.color ? { color: module.fontSettings.color } : {}),
    ...contentFontStyle(contentFontSettings),
  }

  const insertImageSrc = (src: string) => {
    const el = editorRef.current?.getEl()
    if (!el) return
    el.focus()
    const img = document.createElement('img')
    img.src = src
    img.style.cssText = 'max-width:100%;border-radius:6px;display:block;margin-top:6px'
    el.appendChild(img)
    onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (user) {
      // Registered user: upload to R2
      setUploading(true)
      try {
        const { url } = await uploadApi.uploadImage(file)
        insertImageSrc(url)
      } catch { /* ignore upload errors silently */ }
      finally { setUploading(false) }
    } else {
      // Anonymous: embed as base64
      const reader = new FileReader()
      reader.onload = async ev => {
        if (!ev.target?.result) return
        const src = originalQuality
          ? (ev.target.result as string)
          : await resizeDataUrl(ev.target.result as string)
        insertImageSrc(src)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasteImage = async (dataUrl: string) => {
    const resized = await resizeDataUrl(dataUrl)
    insertImageSrc(resized)
  }

  const handleUrlInsert = () => {
    if (urlInput.trim()) insertImageSrc(urlInput.trim())
    setUrlInput('')
    setUrlOpen(false)
  }

  const handleImageClick = (img: HTMLImageElement, _rect: DOMRect) => {
    setSelectedImg(img)
    setSelRect(null) // dismiss selection toolbar
  }

  const handleRemoveImg = () => {
    selectedImg?.remove()
    const el = editorRef.current?.getEl()
    if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
    setSelectedImg(null)
  }

  const handleCropOpen = () => {
    if (selectedImg && !selectedImg.dataset.originalSrc) {
      selectedImg.dataset.originalSrc = selectedImg.src
    }
    setShowCrop(true)
  }

  const handleCropConfirm = (dataUrl: string) => {
    if (!selectedImg) return
    selectedImg.src = dataUrl
    selectedImg.style.width = ''
    const el = editorRef.current?.getEl()
    if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
    setShowCrop(false)
    setSelectedImg(null)
  }

  const handleRestore = () => {
    if (!selectedImg?.dataset.originalSrc) return
    selectedImg.src = selectedImg.dataset.originalSrc
    delete selectedImg.dataset.originalSrc
    selectedImg.style.width = ''
    const el = editorRef.current?.getEl()
    if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
    setSelectedImg(null)
  }

  // Floating toolbar: position:fixed with raw viewport coords (no scrollY offset needed)
  const toolbarStyle = selRect
    ? {
        position: 'fixed' as const,
        top: Math.max(4, selRect.top - 48),
        left: Math.min(window.innerWidth - 240, Math.max(4, selRect.left + selRect.width / 2 - 120)),
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }
    : null

  if (!canEdit) {
    return (
      <div
        className="prose-sm max-w-none text-sm"
        style={editorStyle}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(module.content) }}
      />
    )
  }

  return (
    // Clicking the outer div dismisses image controls (unless stopPropagation in child)
    <div onClick={() => setSelectedImg(null)}>
      <RichTextEditor
        ref={editorRef}
        content={module.content}
        onChange={handleContentChange}
        onSelectionChange={setSelRect}
        onImageClick={handleImageClick}
        onPasteImage={handlePasteImage}
        editorStyle={editorStyle}
      />

      {/* Floating selection toolbar — viewport-fixed */}
      {selRect && toolbarStyle && (
        <div style={toolbarStyle}>
          <BubbleToolbar onFormat={applyFormat} compact />
        </div>
      )}

      {/* Corner resize overlay — portal to body to bypass overflow:hidden clipping */}
      {selectedImg && createPortal(
        <ImageResizeOverlay
          imgEl={selectedImg}
          onResizeEnd={() => {
            const el = editorRef.current?.getEl()
            if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
          }}
          onCrop={handleCropOpen}
          onRemove={handleRemoveImg}
          onRestore={handleRestore}
        />,
        document.body
      )}

      {/* Canvas crop modal — also via portal */}
      {showCrop && selectedImg && createPortal(
        <CropModal
          src={selectedImg.src}
          onConfirm={handleCropConfirm}
          onClose={() => setShowCrop(false)}
        />,
        document.body
      )}

      {/* Insert image row */}
      <div
        className="flex items-center gap-2 mt-2 pt-2 flex-wrap"
        style={{ borderTop: '1px solid var(--color-border)', opacity: 0.75 }}
        onClick={e => e.stopPropagation()}
      >
        <label
          className="flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)', opacity: uploading ? 0.35 : 0.55, pointerEvents: uploading ? 'none' : undefined }}
        >
          <ImagePlus size={13} /> {uploading ? '上传中…' : t('insertImage')}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
        <button
          onClick={() => setUrlOpen(v => !v)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70"
          style={{ color: 'var(--color-text)', opacity: 0.55 }}
        >
          <Link size={13} /> URL
        </button>
        {/* Quality toggle */}
        <button
          onClick={() => onChange({ ...module, originalQuality: !originalQuality })}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all hover:opacity-80 ml-auto"
          style={{
            color: originalQuality ? 'var(--color-primary)' : 'var(--color-text)',
            opacity: originalQuality ? 1 : 0.4,
            border: `1px solid ${originalQuality ? 'var(--color-primary)' : 'transparent'}`,
            backgroundColor: originalQuality ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
          }}
          title={originalQuality ? '原图模式（体积大，可能无法同步到云端）' : '压缩模式（默认）'}
        >
          {originalQuality ? '原图' : '压缩'}
        </button>
        {urlOpen && (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => {
                if (e.nativeEvent.isComposing) return
                if (e.key === 'Enter') handleUrlInsert()
                if (e.key === 'Escape') setUrlOpen(false)
              }}
              placeholder="https://..."
              className="flex-1 text-xs bg-transparent outline-none px-2 py-1 rounded"
              style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
            <button
              onClick={handleUrlInsert}
              className="text-xs px-2 py-1 rounded font-medium hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              插入
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
