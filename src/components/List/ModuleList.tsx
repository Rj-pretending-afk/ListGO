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

const MODULE_META: Record<Module['type'], { icon: string; label: string }> = {
  todo: { icon: '✅', label: '待办' },
  vote: { icon: '📊', label: '投票' },
  text: { icon: '📝', label: '文本' },
}

interface SortableModuleProps {
  module: Module
  cardOpacity: number
  onUpdateModule: (module: Module) => void
  onDeleteModule: (id: string) => void
}

function SortableModule({ module, cardOpacity, onUpdateModule, onDeleteModule }: SortableModuleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  })

  const { icon, label } = MODULE_META[module.type]

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: `rgba(var(--color-card-rgb), ${cardOpacity})`,
          border: '1px solid var(--color-border)',
          backdropFilter: cardOpacity < 1 ? 'blur(8px)' : undefined,
        }}
      >
        {/* Card header row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm select-none">{icon}</span>
          <span className="text-xs font-medium select-none flex-1" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
            {label}
          </span>
          {/* Menu + drag handle on the right */}
          <ModuleMenu onDelete={() => onDeleteModule(module.id)} />
          <button
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing hover:opacity-70 transition-opacity p-0.5"
            style={{ color: 'var(--color-text)', opacity: 0.3 }}
            aria-label="拖拽排序"
          >
            <GripVertical size={15} />
          </button>
        </div>

        {/* Divider */}
        <div className="mb-3" style={{ borderTop: '1px solid var(--color-border)', opacity: 0.5 }} />

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
  cardOpacity: number
  onUpdateModule: (module: Module) => void
  onDeleteModule: (moduleId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function ModuleList({ list, cardOpacity, onUpdateModule, onDeleteModule, onReorder }: ModuleListProps) {
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
    const from = list.modules.findIndex(m => m.id === active.id)
    const to = list.modules.findIndex(m => m.id === over.id)
    if (from !== -1 && to !== -1) onReorder(from, to)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={list.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {list.modules.map(module => (
            <SortableModule
              key={module.id}
              module={module}
              cardOpacity={cardOpacity}
              onUpdateModule={onUpdateModule}
              onDeleteModule={onDeleteModule}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
