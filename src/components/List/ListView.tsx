import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { ListTitle } from './ListTitle'
import { ListBackground } from './ListBackground'
import { ModuleList } from './ModuleList'
import { AddModuleButton } from './AddModuleButton'
import { useListActions } from '../../hooks/useList'
import { useAppStore } from '../../lib/store'
import type { List, ListBackground as ListBackgroundType, Module } from '../../types/list.types'

interface ListViewProps {
  list: List
}

export function ListView({ list }: ListViewProps) {
  const navigate = useNavigate()
  const { updateListTitle, addModule, updateModule, deleteModule } = useListActions()
  const { updateListBg, updateCardOpacity, reorderModules } = useAppStore(
    useShallow(s => ({
      updateListBg: s.updateListBackground,
      updateCardOpacity: s.updateCardOpacity,
      reorderModules: s.reorderModules,
    }))
  )

  const hasBackground =
    list.background.type === 'image' ||
    (list.background.type === 'color' && list.background.value !== '')

  // 有背景时用存储的 cardOpacity，无背景时保持不透明
  const cardOpacity = hasBackground ? (list.cardOpacity ?? 0.7) : 1

  const bgStyle: React.CSSProperties = list.background.type === 'image'
    ? { backgroundImage: `url(${list.background.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : list.background.value
      ? { backgroundColor: list.background.value }
      : { backgroundColor: 'var(--color-bg)' }

  return (
    <div className="min-h-screen" style={bgStyle}>
      {/* Sub-header */}
      <div
        className="sticky top-14 z-10 flex items-center gap-2 px-4 py-3 border-b backdrop-blur-sm"
        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', opacity: 0.97 }}
      >
        <button
          onClick={() => navigate('/')}
          className="p-1 rounded flex-shrink-0 hover:opacity-60 transition-opacity"
          style={{ color: 'var(--color-text)' }}
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <ListTitle
          title={list.title}
          onSave={title => updateListTitle(list.id, title)}
        />
        <ListBackground
          background={list.background}
          cardOpacity={list.cardOpacity ?? 0.7}
          onChange={(bg: ListBackgroundType) => updateListBg(list.id, bg)}
          onOpacityChange={opacity => updateCardOpacity(list.id, opacity)}
        />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <ModuleList
          list={list}
          cardOpacity={cardOpacity}
          onUpdateModule={(module: Module) => updateModule(list.id, module)}
          onDeleteModule={moduleId => deleteModule(list.id, moduleId)}
          onReorder={(from, to) => reorderModules(list.id, from, to)}
        />
        <AddModuleButton onAdd={type => addModule(list.id, type)} />
      </div>
    </div>
  )
}
