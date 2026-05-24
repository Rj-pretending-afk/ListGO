import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, RefreshCw } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { ListTitle } from './ListTitle'
import { ModuleList } from './ModuleList'
import { AddModuleButton } from './AddModuleButton'
import { SharePanel } from '../ui/SharePanel'
import { AvatarStack } from '../presence/AvatarStack'
import { useListActions } from '../../hooks/useList'
import { useAppStore, getSyncError, clearSyncError } from '../../lib/store'
import { useListSync } from '../../hooks/useListSync'
import { usePresence } from '../../hooks/usePresence'
import { useAuthStore } from '../../hooks/useAuth'
import { getAnonVoterId } from '../../lib/anonId'
import { useT } from '../../hooks/useLang'
import type { List, ListPermission, Module } from '../../types/list.types'

interface ListViewProps {
  list: List
  canEdit?: boolean
}

export function ListView({ list, canEdit = true }: ListViewProps) {
  const t = useT()
  const navigate = useNavigate()
  const { updateListTitle, addModule, updateModule, deleteModule } = useListActions()
  const reorderModules = useAppStore(useShallow(s => s.reorderModules))
  const updateListPermission = useAppStore(s => s.updateListPermission)
  const updateInvitedUsers = useAppStore(s => s.updateInvitedUsers)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const [syncErr, setSyncErr] = useState<string | null>(null)
  const { conflict, resolveConflict, manualRefresh, refreshing } = useListSync(list, list.ownerToken)
  const { user } = useAuthStore()
  const { activeUsers } = usePresence(list.id)
  const selfUserId = user?.id ?? `anon-${getAnonVoterId()}`

  // Poll for sync errors on this list (simple approach: check every 2s)
  useEffect(() => {
    if (!canEdit) return
    const id = setInterval(() => {
      const e = getSyncError(list.id)
      if (e) { setSyncErr(e); clearSyncError(list.id) }
    }, 2000)
    return () => clearInterval(id)
  }, [list.id, canEdit])

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
          canEdit={canEdit}
        />
        {!canEdit && (
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', opacity: 0.5 }}>
            {t('viewOnly')}
          </span>
        )}

        {/* Online presence — only when list is cloud-synced */}
        {list.ownerId && (
          <AvatarStack users={activeUsers} selfUserId={selfUserId} />
        )}

        {list.ownerId && (
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:opacity-60 transition-opacity flex-shrink-0 disabled:opacity-30"
            style={{ color: 'var(--color-text)' }}
            title="刷新"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
        {canEdit && (
          <div ref={shareRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShareOpen(v => !v)}
              className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
              style={{ color: 'var(--color-text)' }}
              aria-label={t('shareSettings')}
            >
              <Share2 size={17} />
            </button>
            {shareOpen && (
              <SharePanel
                list={list}
                onPermissionChange={(permission: ListPermission) => {
                  void updateListPermission(list.id, permission)
                }}
                onInvitedUsersChange={(usernames) => updateInvitedUsers(list.id, usernames)}
                onClose={() => setShareOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Sync error banner */}
      {syncErr && (
        <div
          className="px-4 py-2 text-xs flex items-center justify-between"
          style={{ backgroundColor: '#fef2f2', color: '#dc2626', borderBottom: '1px solid #fecaca' }}
        >
          <span>☁ 云端同步失败：{syncErr}（本地已保存）</span>
          <button onClick={() => setSyncErr(null)} className="ml-4 hover:opacity-70">✕</button>
        </div>
      )}

      {/* Conflict banner — shown when remote is ahead and local has unsaved edits */}
      {conflict && (
        <div
          className="px-4 py-2 text-xs flex items-center justify-between flex-wrap gap-2"
          style={{ backgroundColor: '#fffbeb', color: '#92400e', borderBottom: '1px solid #fde68a' }}
        >
          <span>☁ 远端有新版本，与本地修改冲突</span>
          <div className="flex gap-2">
            <button
              onClick={() => resolveConflict('remote')}
              className="px-2 py-0.5 rounded hover:opacity-70 font-medium"
              style={{ backgroundColor: '#92400e', color: 'white' }}
            >
              采纳远程
            </button>
            <button
              onClick={() => resolveConflict('local')}
              className="px-2 py-0.5 rounded hover:opacity-70"
              style={{ border: '1px solid #92400e' }}
            >
              保留本地
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <ModuleList
          list={list}
          onUpdateModule={(module: Module) => updateModule(list.id, module)}
          onDeleteModule={moduleId => deleteModule(list.id, moduleId)}
          onReorder={(from, to) => reorderModules(list.id, from, to)}
          canEdit={canEdit}
        />
        {canEdit && <AddModuleButton onAdd={type => addModule(list.id, type)} />}
      </div>
    </div>
  )
}
