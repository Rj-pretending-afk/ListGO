import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { ListTitle } from './ListTitle'
import { ModuleList } from './ModuleList'
import { AddModuleButton } from './AddModuleButton'
import { useListActions } from '../../hooks/useList'
import { useAppStore } from '../../lib/store'
import type { List, Module } from '../../types/list.types'

interface ListViewProps {
  list: List
}

export function ListView({ list }: ListViewProps) {
  const navigate = useNavigate()
  const { updateListTitle, addModule, updateModule, deleteModule } = useListActions()
  const reorderModules = useAppStore(useShallow(s => s.reorderModules))

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Sub-header */}
      <div
        className="sticky top-14 z-10 flex items-center gap-2 px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
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
