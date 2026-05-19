import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { TodoModule } from '../modules/TodoModule'
import { VoteModule } from '../modules/VoteModule'
import { TextModule } from '../modules/TextModule'
import { ModuleMenu } from '../ui/ModuleMenu'
import { ModuleSettingsPicker } from '../ui/ModuleSettingsPicker'
import type { List, Module, ModuleBackground, ModuleFontSettings } from '../../types/list.types'

const MODULE_META: Record<Module['type'], { icon: string; label: string }> = {
  todo: { icon: '✅', label: '待办' },
  vote: { icon: '📊', label: '投票' },
  text: { icon: '📝', label: '文本' },
}

interface SortableModuleProps {
  module: Module
  onUpdateModule: (module: Module) => void
  onDeleteModule: (id: string) => void
}

function SortableModule({ module, onUpdateModule, onDeleteModule }: SortableModuleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id })
  const { icon, label } = MODULE_META[module.type]
  const bg = module.background

  const hasBg = bg && (bg.imageData || (bg.type === 'color' && bg.value))

  const bgLayerStyle: React.CSSProperties = hasBg
    ? bg.type === 'image'
      ? {
          backgroundImage: `url(${bg.imageData})`,
          backgroundSize: bg.size,
          backgroundPosition: `${bg.posX ?? 50}% ${bg.posY ?? 50}%`,
          opacity: bg.opacity,
        }
      : { backgroundColor: bg.value, opacity: bg.opacity }
    : {}

  const updateBg = (newBg: ModuleBackground | undefined) =>
    onUpdateModule({ ...module, background: newBg } as Module)

  const updateFont = (font: ModuleFontSettings | undefined) =>
    onUpdateModule({ ...module, fontSettings: font } as Module)

  // Font settings apply to the module label (left-top type text), not user content
  const labelStyle: React.CSSProperties = {
    color: module.fontSettings?.color || 'var(--color-text)',
    opacity: module.fontSettings?.color ? 1 : 0.4,
    ...(module.fontSettings?.size ? { fontSize: module.fontSettings.size } : {}),
    ...(module.fontSettings?.family ? { fontFamily: module.fontSettings.family } : {}),
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      {/* Flex row: card content + right drag strip */}
      <div className="rounded-xl flex overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>

        {/* ── Main card area ── */}
        <div className="flex-1 relative min-w-0">
          {/* Base card color */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--color-card)' }} />

          {/* Module background layer */}
          {hasBg && <div style={{ position: 'absolute', inset: 0, ...bgLayerStyle }} />}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '1rem' }}>
            {/* Header row */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm select-none">{icon}</span>
              <span className="font-medium select-none flex-1" style={labelStyle}>
                {label}
              </span>
              <ModuleSettingsPicker
                background={module.background}
                fontSettings={module.fontSettings}
                onBgChange={updateBg}
                onFontChange={updateFont}
              />
              <ModuleMenu onDelete={() => onDeleteModule(module.id)} />
            </div>

            <div className="mb-3" style={{ borderTop: '1px solid var(--color-border)', opacity: 0.35 }} />

            {module.type === 'todo' && <TodoModule module={module} onChange={onUpdateModule} />}
            {module.type === 'vote' && <VoteModule module={module} onChange={onUpdateModule} />}
            {module.type === 'text' && <TextModule module={module} onChange={onUpdateModule} />}
          </div>
        </div>

        {/* ── Right drag strip (theme-aware color) ── */}
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-center"
          style={{
            width: '28px',
            backgroundColor: 'var(--color-drag)',
            color: 'var(--color-drag-icon)',
          }}
          aria-label="拖拽排序"
        >
          <GripVertical size={14} />
        </div>
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
              onUpdateModule={onUpdateModule}
              onDeleteModule={onDeleteModule}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
