import { useState } from 'react'
import { RichTextEditor } from '../editor/RichTextEditor'
import { ImageInsert } from '../editor/ImageInsert'
import type { TextModule as TextModuleType } from '../../types/list.types'

interface TextModuleProps {
  module: TextModuleType
  onChange: (module: TextModuleType) => void
}

export function TextModule({ module, onChange }: TextModuleProps) {
  const [pendingImage, setPendingImage] = useState<string | undefined>()

  const handleImageInsert = (url: string) => {
    setPendingImage(url)
    // 传给编辑器后立刻清除，避免重复插入
    setTimeout(() => setPendingImage(undefined), 100)
  }

  return (
    <div>
      <RichTextEditor
        content={module.content}
        onChange={html => onChange({ ...module, content: html })}
        imageUrl={pendingImage}
      />
      <div className="mt-2">
        <ImageInsert onInsert={handleImageInsert} />
      </div>
    </div>
  )
}
