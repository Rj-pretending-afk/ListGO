import { useRef, useState } from 'react'
import { ImagePlus, Link } from 'lucide-react'
import DOMPurify from 'dompurify'
import { BubbleToolbar } from '../editor/BubbleToolbar'
import { RichTextEditor, type RichTextEditorRef } from '../editor/RichTextEditor'
import type { TextModule as TextModuleType } from '../../types/list.types'

interface TextModuleProps {
  module: TextModuleType
  onChange: (module: TextModuleType) => void
}

export function TextModule({ module, onChange }: TextModuleProps) {
  const editorRef = useRef<RichTextEditorRef>(null)
  // 浮动工具栏位置（viewport 坐标）
  const [floatRect, setFloatRect] = useState<DOMRect | null>(null)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const applyFormat = (cmd: string, value?: string) =>
    editorRef.current?.applyFormat(cmd, value)

  const handleContentChange = (html: string) =>
    onChange({ ...module, content: html })

  const insertImage = (src: string) => {
    const el = editorRef.current?.getEl()
    if (!el) return
    el.focus()
    const img = document.createElement('img')
    img.src = src
    img.style.cssText = 'max-width:100%;border-radius:8px;margin-top:6px;cursor:nw-resize'
    el.appendChild(img)
    onChange({ ...module, content: DOMPurify.sanitize(el.innerHTML) })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) insertImage(ev.target.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleUrlInsert = () => {
    const url = urlInput.trim()
    if (url) insertImage(url)
    setUrlInput('')
    setUrlOpen(false)
  }

  // 浮动工具栏：相对视口定位，确保不超出屏幕
  const floatStyle = floatRect
    ? {
        position: 'fixed' as const,
        top: Math.max(4, floatRect.top - 52),
        left: Math.min(
          window.innerWidth - 230,
          Math.max(4, floatRect.left + floatRect.width / 2 - 115)
        ),
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }
    : null

  return (
    <div>
      {/* 固定工具栏 */}
      <div className="mb-2">
        <BubbleToolbar onFormat={applyFormat} />
      </div>

      {/* 编辑区 */}
      <RichTextEditor
        ref={editorRef}
        content={module.content}
        onChange={handleContentChange}
        onSelectionChange={setFloatRect}
      />

      {/* 浮动选区工具栏 */}
      {floatRect && floatStyle && (
        <div style={floatStyle}>
          <BubbleToolbar onFormat={applyFormat} compact />
        </div>
      )}

      {/* 插图区 */}
      <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)', opacity: 0.8 }}>
        {/* 本地上传 */}
        <label
          className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity cursor-pointer"
          style={{ color: 'var(--color-text)', opacity: 0.5 }}
          title="上传本地图片"
        >
          <ImagePlus size={13} />
          上传
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* URL 插入 */}
        <button
          onClick={() => setUrlOpen(v => !v)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)', opacity: 0.5 }}
          title="粘贴图片 URL"
        >
          <Link size={13} />
          URL
        </button>

        {urlOpen && (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleUrlInsert()
                if (e.key === 'Escape') setUrlOpen(false)
              }}
              placeholder="https://..."
              className="flex-1 text-xs bg-transparent outline-none px-2 py-1 rounded"
              style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
            <button
              onClick={handleUrlInsert}
              className="text-xs px-2 py-1 rounded font-medium hover:opacity-80 transition-opacity"
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
