import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Clock, CloudUpload, Trash2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLists, useLoaded, useListActions } from '../hooks/useList'
import { useT, useLangStore } from '../hooks/useLang'
import { useAppStore } from '../lib/store'
import { useAuthStore } from '../hooks/useAuth'

export default function Home() {
  const t = useT()
  const lang = useLangStore(s => s.lang)
  const currentUser = useAuthStore(s => s.user)
  const timeFormat = useAppStore(s => s.timeFormat)
  const toggleTimeFormat = useAppStore(s => s.toggleTimeFormat)

  const fmt = (ts: number) => timeFormat === 'relative'
    ? formatDistanceToNow(ts, { locale: lang === 'zh' ? zhCN : undefined, addSuffix: true })
    : format(ts, 'MM/dd HH:mm')
  const lists = useLists()
  const loaded = useLoaded()
  const { createList, deleteList } = useListActions()
  const navigate = useNavigate()
  const uploadToCloud = useAppStore(s => s.uploadToCloud)
  const claimLists = useAppStore(s => s.claimLists)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const handleUpload = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!currentUser) return
    setUploading(u => ({ ...u, [id]: true }))
    try {
      await uploadToCloud(id)
      // Claim locally: clear ownerToken, set ownerId to current user
      await claimLists([id], currentUser.id)
    } catch { /* silent */ }
    finally { setUploading(u => ({ ...u, [id]: false })) }
  }

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    const id = await createList(title, currentUser?.id)
    setNewTitle('')
    setCreating(false)
    navigate(`/list/${id}`)
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{t('myLists')}</h2>
        <button onClick={() => { setCreating(true); setNewTitle('') }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          <Plus size={15} /> {t('newList')}
        </button>
      </div>

      {creating && (
        <div className="mb-5 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            placeholder={t('newListPlaceholder')}
            className="w-full bg-transparent outline-none text-sm mb-3"
            style={{ color: 'var(--color-text)' }} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 rounded text-sm hover:opacity-70"
              style={{ color: 'var(--color-text)', opacity: 0.6 }}>{t('cancel')}</button>
            <button onClick={handleCreate} disabled={!newTitle.trim()}
              className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-35 hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>{t('create')}</button>
          </div>
        </div>
      )}

      {lists.length === 0 && !creating && (
        <div className="text-center py-20" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
          <p className="text-4xl mb-3">💌</p>
          <p className="text-sm">{t('emptyHint')}</p>
        </div>
      )}

      {lists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lists.map(list => (
            <div key={list.id} onClick={() => { if (pendingDelete === list.id) { setPendingDelete(null); return } navigate(`/list/${list.id}`) }}
              className="p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity relative group"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="font-semibold text-sm mb-1.5 pr-6 truncate" style={{ color: 'var(--color-text)' }}>
                {list.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                  {list.modules.length} {t('moduleCount')}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.3 }}>·</span>
                <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                  {t('timeCreated')} {fmt(list.createdAt)}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.3 }}>·</span>
                <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                  {t('timeModified')} {fmt(list.updatedAt)}
                </span>
                <button onClick={e => { e.stopPropagation(); toggleTimeFormat() }}
                  className="hover:opacity-70 transition-opacity ml-auto"
                  title={t('toggleTimeFormat')} style={{ color: 'var(--color-text)', opacity: 0.3 }}>
                  <Clock size={10} />
                </button>
              </div>
              {currentUser && list.ownerToken && !list.ownerId && (
                <button
                  onClick={e => handleUpload(e, list.id)}
                  disabled={uploading[list.id]}
                  title={uploading[list.id] ? t('syncing') : t('syncToCloud')}
                  className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:opacity-70 disabled:opacity-30"
                  style={{ color: 'var(--color-primary)' }}>
                  <CloudUpload size={14} />
                </button>
              )}
              {pendingDelete === list.id ? (
                <div
                  className="absolute top-2 right-2 flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
                  style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => { deleteList(list.id); setPendingDelete(null) }}
                    className="font-medium hover:opacity-80"
                    style={{ color: '#ef4444' }}
                  >
                    {t('confirmDelete')}
                  </button>
                  <span style={{ color: 'var(--color-text)', opacity: 0.3 }}>|</span>
                  <button
                    onClick={() => setPendingDelete(null)}
                    className="hover:opacity-80"
                    style={{ color: 'var(--color-text)', opacity: 0.5 }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setPendingDelete(list.id) }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:opacity-70"
                  style={{ color: 'var(--color-text)' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
