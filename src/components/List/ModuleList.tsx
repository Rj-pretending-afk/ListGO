import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { TodoModule } from '../modules/TodoModule'
import { VoteModule } from '../modules/VoteModule'
import { TextModule } from '../modules/TextModule'
import { ModuleMenu } from '../ui/ModuleMenu'
import type { List, Module } from '../../types/list.types'

const MODULE_LABELS: Record<Module['type'], string> = {
  todo: '✅ 待办',
  vote: '📊 投票',
  text: '📝 文本',
}

interface SortableModuleProps {
  module: Module
  onUpdateModule: (module: Module) => void
  onDeleteModule: (id: string) => void
}

function SortableModule({ module, onUpdateModule, onDeleteModule }: SortableModuleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="touch-none flex-shrink-0 cursor-grab active:cursor-grabbing hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)', opacity: 0.25 }}
            aria-label="拖拽排序"
          >
            <GripVertical size={14} />
          </button>
          <span className="text-xs font-medium select-none flex-1" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
            {MODULE_LABELS[module.type]}
          </span>
          <ModuleMenu onDelete={() => onDeleteModule(module.id)} />
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
    </div>
  )
}

interface ModuleListProps {
  list: List
  onUpdateModule: (module: Module) => void
  onDeleteModule: (moduleId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function ModuleList({ list, onUpdateModule, onDeleteModule, onReorder }: ModuleListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } }),
  )

  if (list.modules.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        还没有模块，点下方「添加模块」开始
      </p>
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = list.modules.findIndex(m => m.id === active.id)
    const toIndex = list.modules.findIndex(m => m.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={list.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {list.modules.map(module => (
            <SortableModule
              key={module.id}
              module={module}
              onUpdateModule={onUpdateModule}
              onDeleteModule={onDeleteModule}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
