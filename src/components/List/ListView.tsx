import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ListTitle } from './ListTitle'
import { ListBackground } from './ListBackground'
import { ModuleList } from './ModuleList'
import { AddModuleButton } from './AddModuleButton'
import { useListActions } from '../../hooks/useList'
import { useAppStore } from '../../lib/store'
import type { List, ListBackground as ListBackgroundType, Module } from '../../types/list.types'
import { useShallow } from 'zustand/react/shallow'

interface ListViewProps {
  list: List
}

export function ListView({ list }: ListViewProps) {
  const navigate = useNavigate()
  const { updateListTitle, addModule, updateModule, deleteModule } = useListActions()
  const { updateListBackground: updateListBg, reorderModules } = useAppStore(
    useShallow(s => ({ updateListBackground: s.updateListBackground, reorderModules: s.reorderModules }))
  )

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
          onChange={(bg: ListBackgroundType) => updateListBg(list.id, bg)}
        />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <ModuleList
          list={list}
          onUpdateModule={(module: Module) => updateModule(list.id, module)}
          onDeleteModule={moduleId => deleteModule(list.id, moduleId)}
          onReorder={(from, to) => reorderModules(list.id, from, to)}
        />
        <AddModuleButton onAdd={type => addModule(list.id, type)} />
      </div>
    </div>
  )
}
