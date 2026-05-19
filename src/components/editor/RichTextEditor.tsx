import { useRef, useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { BubbleToolbar } from './BubbleToolbar'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  imageUrl?: string
}

export function RichTextEditor({ content, onChange, imageUrl }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // 仅在非焦点状态下同步外部内容（避免光标跳位）
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = content
    }
  }, [content])

  // 插入图片时追加到末尾
  useEffect(() => {
    if (!imageUrl || !ref.current) return
    const img = document.createElement('img')
    img.src = imageUrl
    img.style.maxWidth = '100%'
    img.style.borderRadius = '8px'
    img.style.marginTop = '8px'
    ref.current.appendChild(img)
    emitChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  const emitChange = () => {
    if (!ref.current) return
    onChange(DOMPurify.sanitize(ref.current.innerHTML))
  }

  const handleSelectionChange = () => {
    const sel = window.getSelection()
    setShowToolbar(!!sel && !sel.isCollapsed && ref.current?.contains(sel.anchorNode) === true)
  }

  const applyFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    ref.current?.focus()
    emitChange()
  }

  return (
    <div className="relative">
      {showToolbar && (
        <div className="mb-2">
          <BubbleToolbar onFormat={applyFormat} />
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onBlur={() => setShowToolbar(false)}
        className="outline-none min-h-[40px] text-sm leading-relaxed"
        style={{ color: 'var(--color-text)' }}
        data-placeholder="输入文字…"
      />
    </div>
  )
}
