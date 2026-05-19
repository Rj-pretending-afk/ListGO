import { useRef, useState } from 'react'
import { ImagePlus, Link } from 'lucide-react'
import DOMPurify from 'dompurify'
import { BubbleToolbar } from '../editor/BubbleToolbar'
import { RichTextEditor, type RichTextEditorRef } from '../editor/RichTextEditor'
import { ImageControls } from '../editor/ImageControls'
import { CropModal } from '../editor/CropModal'
import type { TextModule as TextModuleType } from '../../types/list.types'

interface TextModuleProps {
  module: TextModuleType
  onChange: (module: TextModuleType) => void
}

export function TextModule({ module, onChange }: TextModuleProps) {
  const editorRef = useRef<RichTextEditorRef>(null)
  const [selRect, setSelRect] = useState<DOMRect | null>(null)
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)
  const [imgRect, setImgRect] = useState<DOMRect | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const applyFormat = (cmd: string, value?: string) => editorRef.current?.applyFormat(cmd, value)
  const handleContentChange = (html: string) => onChange({ ...module, content: html })

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) insertImageSrc(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleUrlInsert = () => {
    if (urlInput.trim()) insertImageSrc(urlInput.trim())
    setUrlInput('')
    setUrlOpen(false)
  }

  const handleImageClick = (img: HTMLImageElement, rect: DOMRect) => {
    setSelectedImg(img)
    setImgRect(rect)
    setSelRect(null) // dismiss selection toolbar
  }

  const handleWidthChange = (w: number) => {
    if (!selectedImg) return
    selectedImg.style.width = `${w}px`
    const el = editorRef.current?.getEl()
    if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
    setImgRect(selectedImg.getBoundingClientRect())
  }

  const handleRemoveImg = () => {
    selectedImg?.remove()
    const el = editorRef.current?.getEl()
    if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
    setSelectedImg(null)
    setImgRect(null)
  }

  const handleCropConfirm = (dataUrl: string) => {
    if (!selectedImg) return
    selectedImg.src = dataUrl
    selectedImg.style.width = ''
    const el = editorRef.current?.getEl()
    if (el) onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
    setShowCrop(false)
    setSelectedImg(null)
    setImgRect(null)
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

  return (
    // Clicking the outer div dismisses image controls (unless stopPropagation in child)
    <div onClick={() => { setSelectedImg(null); setImgRect(null) }}>
      <RichTextEditor
        ref={editorRef}
        content={module.content}
        onChange={handleContentChange}
        onSelectionChange={setSelRect}
        onImageClick={handleImageClick}
      />

      {/* Floating selection toolbar — viewport-fixed */}
      {selRect && toolbarStyle && (
        <div style={toolbarStyle}>
          <BubbleToolbar onFormat={applyFormat} compact />
        </div>
      )}

      {/* Image controls (width + crop + remove) */}
      {selectedImg && imgRect && (
        <ImageControls
          imgEl={selectedImg}
          rect={imgRect}
          onWidthChange={handleWidthChange}
          onCrop={() => setShowCrop(true)}
          onRemove={handleRemoveImg}
        />
      )}

      {/* Canvas crop modal */}
      {showCrop && selectedImg && (
        <CropModal
          src={selectedImg.src}
          onConfirm={handleCropConfirm}
          onClose={() => setShowCrop(false)}
        />
      )}

      {/* Insert image row */}
      <div
        className="flex items-center gap-2 mt-2 pt-2"
        style={{ borderTop: '1px solid var(--color-border)', opacity: 0.75 }}
        onClick={e => e.stopPropagation()}
      >
        <label
          className="flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)', opacity: 0.55 }}
        >
          <ImagePlus size={13} /> 上传
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
        <button
          onClick={() => setUrlOpen(v => !v)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70"
          style={{ color: 'var(--color-text)', opacity: 0.55 }}
        >
          <Link size={13} /> URL
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
