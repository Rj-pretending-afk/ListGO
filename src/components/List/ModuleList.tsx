import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock } from 'lucide-react'
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
import { FontSettingsPicker } from '../ui/FontSettingsPicker'
import { ContentFormattingBar } from '../ui/ContentFormattingBar'
import { useT, useLangStore } from '../../hooks/useLang'
import { useAppStore } from '../../lib/store'
import type { List, Module, ModuleBackground, ModuleFontSettings, ContentFontSettings } from '../../types/list.types'

const MODULE_ICONS: Record<Module['type'], string> = {
  todo: '✅', vote: '📊', text: '📝',
}

interface SortableModuleProps {
  module: Module
  onUpdateModule: (module: Module) => void
  onDeleteModule: (id: string) => void
}

function SortableModule({ module, onUpdateModule, onDeleteModule }: SortableModuleProps) {
  const t = useT()
  const lang = useLangStore(s => s.lang)
  const timeFormat = useAppStore(s => s.timeFormat)
  const toggleTimeFormat = useAppStore(s => s.toggleTimeFormat)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id })
  const icon = MODULE_ICONS[module.type]
  const DEFAULT_LABELS = { todo: t('moduleLabelTodo'), vote: t('moduleLabelVote'), text: t('moduleLabelText') }
  const defaultLabel = DEFAULT_LABELS[module.type]
  const defaultFull = `${icon} ${defaultLabel}`
  const bg = module.background

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')

  // Show customLabel if set, otherwise emoji + default label as one string
  const displayLabel = module.customLabel || defaultFull

  const saveLabel = () => {
    const trimmed = labelDraft.trim()
    // If user typed back exactly the default, treat as "no custom label"
    onUpdateModule({ ...module, customLabel: (trimmed && trimmed !== defaultFull) ? trimmed : undefined } as Module)
    setEditingLabel(false)
  }

  const startEditLabel = () => {
    setLabelDraft(module.customLabel ?? '')   // start empty so user types fresh
    setEditingLabel(true)
  }

  const hasBg = bg && (bg.imageData || (bg.type === 'color' && bg.value))

  const bgLayerStyle: React.CSSProperties = hasBg
    ? bg.type === 'image'
      ? {
          backgroundImage: `url(${bg.imageData})`,
          backgroundSize: bg.sizePercent ? `${bg.sizePercent}%` : bg.size,
          backgroundPosition: `${bg.posX ?? 50}% ${bg.posY ?? 50}%`,
          backgroundRepeat: bg.sizePercent ? 'no-repeat' : undefined,
          opacity: bg.opacity,
        }
      : { backgroundColor: bg.value, opacity: bg.opacity }
    : {}

  const updateBg = (newBg: ModuleBackground | undefined) =>
    onUpdateModule({ ...module, background: newBg } as Module)

  const updateFont = (font: ModuleFontSettings | undefined) =>
    onUpdateModule({ ...module, fontSettings: font } as Module)

  const updateContentFont = (cf: ContentFontSettings | undefined) =>
    onUpdateModule({ ...module, contentFontSettings: cf } as Module)

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
      <div className="rounded-xl flex overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>

        {/* ── Main card area ── */}
        <div className="flex-1 relative min-w-0">
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--color-card)' }} />
          {hasBg && <div style={{ position: 'absolute', inset: 0, ...bgLayerStyle }} />}

          <div style={{ position: 'relative', zIndex: 1, padding: '1rem' }}>
            {/* Header row — emoji is part of the editable label */}
            <div className="flex items-center gap-1.5 mb-2">
              {editingLabel ? (
                <input
                  autoFocus
                  value={labelDraft}
                  onChange={e => setLabelDraft(e.target.value)}
                  onBlur={saveLabel}
                  onKeyDown={e => {
                    if (e.nativeEvent.isComposing) return
                    if (e.key === 'Enter') saveLabel()
                    if (e.key === 'Escape') setEditingLabel(false)
                  }}
                  placeholder={defaultFull}
                  className="flex-1 bg-transparent outline-none font-medium min-w-0 text-sm"
                  style={labelStyle}
                />
              ) : (
                <span
                  onClick={startEditLabel}
                  className="font-medium select-none flex-1 cursor-text hover:opacity-60 transition-opacity truncate text-sm"
                  style={module.customLabel
                    ? labelStyle
                    : { ...labelStyle, opacity: 0.28 }  // ghost placeholder
                  }
                  title={t('editLabelHint')}
                >
                  {displayLabel}
                </span>
              )}

              <FontSettingsPicker
                fontSettings={module.fontSettings}
                onFontChange={updateFont}
              />
              <ModuleSettingsPicker
                background={module.background}
                onBgChange={updateBg}
              />
              <ModuleMenu onDelete={() => onDeleteModule(module.id)} />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', opacity: 0.35 }} />

            <ContentFormattingBar
              settings={module.contentFontSettings}
              onChange={updateContentFont}
            />

            {module.type === 'todo' && <TodoModule module={module} onChange={onUpdateModule} contentFontSettings={module.contentFontSettings} />}
            {module.type === 'vote' && <VoteModule module={module} onChange={onUpdateModule} contentFontSettings={module.contentFontSettings} />}
            {module.type === 'text' && <TextModule module={module} onChange={onUpdateModule} contentFontSettings={module.contentFontSettings} />}

            {/* Timestamps */}
            {(module.createdAt || module.updatedAt) && (
              <div className="flex items-center gap-3 mt-2 pt-1.5"
                style={{ borderTop: '1px solid var(--color-border)', opacity: 0.3 }}>
                {module.createdAt && (
                  <span className="text-xs" style={{ color: 'var(--color-text)' }}>
                    {t('timeCreated')} {timeFormat === 'relative'
                      ? formatDistanceToNow(module.createdAt, { locale: lang === 'zh' ? zhCN : undefined, addSuffix: true })
                      : format(module.createdAt, 'MM/dd HH:mm')}
                  </span>
                )}
                {module.updatedAt && module.updatedAt !== module.createdAt && (
                  <span className="text-xs" style={{ color: 'var(--color-text)' }}>
                    {t('timeModified')} {timeFormat === 'relative'
                      ? formatDistanceToNow(module.updatedAt, { locale: lang === 'zh' ? zhCN : undefined, addSuffix: true })
                      : format(module.updatedAt, 'MM/dd HH:mm')}
                  </span>
                )}
                <button onClick={toggleTimeFormat} className="ml-auto hover:opacity-70 transition-opacity"
                  title={t('toggleTimeFormat')} style={{ color: 'var(--color-text)' }}>
                  <Clock size={11} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right drag strip ── */}
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-center"
          style={{ width: '28px', backgroundColor: 'var(--color-drag)', color: 'var(--color-drag-icon)' }}
          aria-label={t('editLabelHint')}
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
