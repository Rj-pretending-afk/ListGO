import { useRef, useEffect } from 'react'
import type { TextModule as TextModuleType } from '../../types/list.types'

interface TextModuleProps {
  module: TextModuleType
  onChange: (module: TextModuleType) => void
}

export function TextModule({ module, onChange }: TextModuleProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Only sync from props when not focused (avoids caret jumping)
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = module.content
    }
  }, [module.content])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={e => onChange({ ...module, content: (e.target as HTMLDivElement).innerText })}
      className="outline-none min-h-[40px] text-sm leading-relaxed"
      style={{ color: 'var(--color-text)' }}
      data-placeholder="输入文字…"
    />
  )
}
