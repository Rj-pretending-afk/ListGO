import { useEffect, useImperativeHandle, forwardRef } from 'react'
import DOMPurify from 'dompurify'

export interface RichTextEditorRef {
  applyFormat: (cmd: string, value?: string) => void
  getEl: () => HTMLDivElement | null
}

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onSelectionChange?: (rect: DOMRect | null) => void
  onImageClick?: (img: HTMLImageElement, rect: DOMRect) => void
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, onSelectionChange, onImageClick }, ref) => {
    let el: HTMLDivElement | null = null
    const setRef = (node: HTMLDivElement | null) => { el = node }

    useImperativeHandle(ref, () => ({
      applyFormat: (cmd, value) => {
        el?.focus()
        document.execCommand(cmd, false, value)
        if (el) onChange(DOMPurify.sanitize(el.innerHTML))
      },
      getEl: () => el,
    }))

    useEffect(() => {
      if (el && document.activeElement !== el) el.innerHTML = content
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    const emitChange = () => { if (el) onChange(DOMPurify.sanitize(el.innerHTML)) }

    const checkSelection = () => {
      if (!onSelectionChange) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !el?.contains(sel.anchorNode)) {
        onSelectionChange(null)
        return
      }
      // getBoundingClientRect() returns viewport coords — used directly with position:fixed
      onSelectionChange(sel.getRangeAt(0).getBoundingClientRect())
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      const imageItem = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const blob = imageItem.getAsFile()
      if (!blob) return
      const reader = new FileReader()
      reader.onload = ev => {
        if (!ev.target?.result || !el) return
        el.focus()
        const img = document.createElement('img')
        img.src = ev.target.result as string
        img.style.cssText = 'max-width:100%;border-radius:6px;display:block;margin-top:6px'
        el.appendChild(img)
        emitChange()
      }
      reader.readAsDataURL(blob)
    }

    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' && onImageClick) {
        e.stopPropagation()
        onImageClick(target as HTMLImageElement, target.getBoundingClientRect())
      }
    }

    return (
      <div
        ref={setRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onBlur={() => onSelectionChange?.(null)}
        onPaste={handlePaste}
        onClick={handleClick}
        className="outline-none min-h-[60px] text-sm leading-relaxed"
        style={{ color: 'var(--color-text)' }}
        data-placeholder="输入文字…"
      />
    )
  }
)
RichTextEditor.displayName = 'RichTextEditor'
