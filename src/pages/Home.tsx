import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLists, useLoaded, useListActions } from '../hooks/useList'

export default function Home() {
  const lists = useLists()
  const loaded = useLoaded()
  const { createList, deleteList } = useListActions()
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    const id = await createList(title)
    setNewTitle('')
    setCreating(false)
    navigate(`/list/${id}`)
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        加载中…
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          我的清单
        </h2>
        <button
          onClick={() => { setCreating(true); setNewTitle('') }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={15} /> 新建
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div
          className="mb-5 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="清单标题（必填）"
            className="w-full bg-transparent outline-none text-sm mb-3"
            style={{ color: 'var(--color-text)' }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-1.5 rounded text-sm hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-text)', opacity: 0.6 }}
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-35 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              创建
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && !creating && (
        <div className="text-center py-20" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
          <p className="text-4xl mb-3">💌</p>
          <p className="text-sm">还没有清单，点「新建」开始</p>
        </div>
      )}

      {/* List cards */}
      {lists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => navigate(`/list/${list.id}`)}
              className="p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity relative group"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <h3 className="font-semibold text-sm mb-1.5 pr-6 truncate" style={{ color: 'var(--color-text)' }}>
                {list.title}
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                {list.modules.length} 个模块 · {formatDistanceToNow(list.updatedAt, { locale: zhCN, addSuffix: true })}
              </p>
              <button
                onClick={e => { e.stopPropagation(); deleteList(list.id) }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:opacity-70"
                style={{ color: 'var(--color-text)' }}
                aria-label="删除清单"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
