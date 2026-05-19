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
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, onSelectionChange }, ref) => {
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
      if (el && document.activeElement !== el) {
        el.innerHTML = content
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    const emitChange = () => {
      if (el) onChange(DOMPurify.sanitize(el.innerHTML))
    }

    const checkSelection = () => {
      if (!onSelectionChange) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !el?.contains(sel.anchorNode)) {
        onSelectionChange(null)
        return
      }
      onSelectionChange(sel.getRangeAt(0).getBoundingClientRect())
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
        className="outline-none min-h-[60px] text-sm leading-relaxed"
        style={{ color: 'var(--color-text)' }}
        data-placeholder="输入文字…"
      />
    )
  }
)
RichTextEditor.displayName = 'RichTextEditor'
