import { Trash2 } from 'lucide-react'
import { TodoModule } from '../modules/TodoModule'
import { VoteModule } from '../modules/VoteModule'
import { TextModule } from '../modules/TextModule'
import type { List, Module } from '../../types/list.types'

const MODULE_LABELS: Record<Module['type'], string> = {
  todo: '✅ 待办',
  vote: '📊 投票',
  text: '📝 文本',
}

interface ModuleListProps {
  list: List
  onUpdateModule: (module: Module) => void
  onDeleteModule: (moduleId: string) => void
}

export function ModuleList({ list, onUpdateModule, onDeleteModule }: ModuleListProps) {
  if (list.modules.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        还没有模块，点下方「添加模块」开始
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {list.modules.map(module => (
        <div
          key={module.id}
          className="rounded-xl p-4 group"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium select-none" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
              {MODULE_LABELS[module.type]}
            </span>
            <button
              onClick={() => onDeleteModule(module.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:opacity-70"
              style={{ color: 'var(--color-text)' }}
              title="删除模块"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {module.type === 'todo' && (
            <TodoModule module={module} onChange={onUpdateModule} />
          )}
          {module.type === 'vote' && (
            <VoteModule module={module} onChange={onUpdateModule} />
          )}
          {module.type === 'text' && (
            <TextModule module={module} onChange={onUpdateModule} />
          )}
        </div>
      ))}
    </div>
  )
}
