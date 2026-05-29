import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, CloudUpload, Trash2, RefreshCw, X } from 'lucide-react'
import { StylePicker } from '../components/theme/StylePicker'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLists, useLoaded, useListActions } from '../hooks/useList'
import { useT, useLangStore } from '../hooks/useLang'
import { useAppStore } from '../lib/store'
import { useAuthStore } from '../hooks/useAuth'
import { getRecentLists, removeRecentList, type RecentListEntry } from '../hooks/useRecentLists'
import { listApi, type InvitedListEntry } from '../lib/api'
import { AvatarDisplay } from '../components/ui/AvatarDisplay'

type Tab = 'mine' | 'recent' | 'invited'

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
  const syncFromCloud = useAppStore(s => s.syncFromCloud)

  const [recentLists, setRecentLists] = useState<RecentListEntry[]>([])
  const [invitedLists, setInvitedLists] = useState<InvitedListEntry[]>([])
  const [tab, setTab] = useState<Tab>('mine')

  useEffect(() => {
    if (currentUser) setRecentLists(getRecentLists())
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    listApi.invited().then(setInvitedLists).catch(() => {})
  }, [currentUser])

  const syncRef = useRef(syncFromCloud)
  useEffect(() => { syncRef.current = syncFromCloud }, [syncFromCloud])
  useEffect(() => {
    if (!currentUser) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void syncRef.current()
    }, 15000)
    return () => clearInterval(id)
  }, [currentUser])

  const [syncing, setSyncing] = useState(false)
  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    try { await syncFromCloud() } finally { setSyncing(false) }
  }

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

  const removeRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeRecentList(id)
    setRecentLists(prev => prev.filter(r => r.id !== id))
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="p-4 space-y-2">
                <div className="h-3 rounded-full w-3/5" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="h-2 rounded-full w-2/5" style={{ backgroundColor: 'var(--color-border)', opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const showTabs = !!currentUser
  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          {showTabs ? (
            <>
              <button onClick={() => setTab('mine')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: tab === 'mine' ? 'var(--color-primary)' : 'transparent',
                  color: tab === 'mine' ? 'white' : 'var(--color-text)',
                  opacity: tab === 'mine' ? 1 : 0.5,
                }}>
                {t('myLists')}
              </button>
              <button onClick={() => setTab('recent')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: tab === 'recent' ? 'var(--color-primary)' : 'transparent',
                  color: tab === 'recent' ? 'white' : 'var(--color-text)',
                  opacity: tab === 'recent' ? 1 : 0.5,
                }}>
                {t('recentLists')}
              </button>
              <button onClick={() => setTab('invited')}
                className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: tab === 'invited' ? 'var(--color-primary)' : 'transparent',
                  color: tab === 'invited' ? 'white' : 'var(--color-text)',
                  opacity: tab === 'invited' ? 1 : 0.5,
                }}>
                {t('invitedLists')}
                {invitedLists.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                    style={{ backgroundColor: '#ec4899', color: 'white' }}
                  >
                    {invitedLists.length}
                  </span>
                )}
              </button>
            </>
          ) : (
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{t('myLists')}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StylePicker />
          {currentUser && (
            <button onClick={handleSync} disabled={syncing}
              className="p-1.5 rounded-lg hover:opacity-60 transition-opacity disabled:opacity-30"
              style={{ color: 'var(--color-text)' }} title="刷新">
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            </button>
          )}
          {tab === 'mine' && (
            <button onClick={() => { setCreating(true); setNewTitle('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-primary hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              <Plus size={15} /> {t('newList')}
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {creating && tab === 'mine' && (
        <div className="mb-5 p-4 rounded-xl" style={cardStyle}>
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
              className="px-3 py-1.5 rounded-lg text-sm font-medium btn-primary disabled:opacity-35 hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>{t('create')}</button>
          </div>
        </div>
      )}

      {/* My lists */}
      {tab === 'mine' && (
        <>
          {lists.length === 0 && !creating && (
            <div className="text-center py-20" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
              <p className="text-4xl mb-3">💌</p>
              <p className="text-sm">{t('emptyHint')}</p>
            </div>
          )}
          {lists.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lists.map(list => (
                <div key={list.id}
                  onClick={() => { if (pendingDelete === list.id) { setPendingDelete(null); return } navigate(`/list/${list.id}`) }}
                  className="p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity relative group"
                  style={cardStyle}>
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
                    <button onClick={e => handleUpload(e, list.id)} disabled={uploading[list.id]}
                      title={uploading[list.id] ? t('syncing') : t('syncToCloud')}
                      className="absolute top-3 right-8 opacity-20 group-hover:opacity-100 [@media(hover:none)]:opacity-50 transition-opacity p-0.5 rounded hover:opacity-70 disabled:opacity-30"
                      style={{ color: 'var(--color-primary)' }}>
                      <CloudUpload size={14} />
                    </button>
                  )}
                  {pendingDelete === list.id ? (
                    <div className="absolute top-2 right-2 flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
                      style={cardStyle} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { deleteList(list.id); setPendingDelete(null) }}
                        className="font-medium hover:opacity-80" style={{ color: '#ef4444' }}>
                        {t('confirmDelete')}
                      </button>
                      <span style={{ color: 'var(--color-text)', opacity: 0.3 }}>|</span>
                      <button onClick={() => setPendingDelete(null)} className="hover:opacity-80"
                        style={{ color: 'var(--color-text)', opacity: 0.5 }}>{t('cancel')}</button>
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setPendingDelete(list.id) }}
                      className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 [@media(hover:none)]:opacity-50 transition-opacity p-0.5 rounded hover:opacity-70"
                      style={{ color: 'var(--color-text)' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Recent lists */}
      {tab === 'recent' && (
        <>
          {recentLists.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
              <p className="text-sm">{t('recentEmpty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentLists.map(entry => (
                <div key={entry.id}
                  onClick={() => navigate(`/list/${entry.id}`)}
                  className="p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity relative group"
                  style={cardStyle}>
                  <h3 className="font-semibold text-sm mb-1.5 pr-6 truncate" style={{ color: 'var(--color-text)' }}>
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {entry.ownerUsername && (
                      <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                        @{entry.ownerUsername}
                      </span>
                    )}
                    {entry.ownerUsername && <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.3 }}>·</span>}
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                      {t('timeModified')} {fmt(entry.updatedAt)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.3 }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                      {t('recentVisited')} {fmt(entry.lastVisited)}
                    </span>
                    <button onClick={e => { e.stopPropagation(); toggleTimeFormat() }}
                      className="hover:opacity-70 transition-opacity ml-auto"
                      title={t('toggleTimeFormat')} style={{ color: 'var(--color-text)', opacity: 0.3 }}>
                      <Clock size={10} />
                    </button>
                  </div>
                  <button onClick={e => removeRecent(e, entry.id)}
                    className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 [@media(hover:none)]:opacity-50 transition-opacity p-0.5 rounded hover:opacity-70"
                    style={{ color: 'var(--color-text)' }} title="从最近移除">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Invited lists */}
      {tab === 'invited' && (
        <>
          {invitedLists.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
              <p className="text-sm">{t('invitedListsEmpty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {invitedLists.map(entry => (
                <div key={entry.id}
                  onClick={() => navigate(`/list/${entry.id}`)}
                  className="p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity relative group"
                  style={cardStyle}>
                  <h3 className="font-semibold text-sm mb-1.5 truncate" style={{ color: 'var(--color-text)' }}>
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <AvatarDisplay
                      user={{ username: entry.ownerUsername, avatarColor: entry.ownerAvatarColor, avatarImage: entry.ownerAvatarImage }}
                      size={16}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                      @{entry.ownerUsername}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.3 }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                      {entry.moduleCount} {t('moduleCount')}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.3 }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                      {t('timeModified')} {fmt(entry.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
