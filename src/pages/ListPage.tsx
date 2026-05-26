import { useCallback, useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { ListView } from '../components/List/ListView'
import { AnonIdentitySheet } from '../components/ui/AnonIdentitySheet'
import { useListById } from '../hooks/useList'
import { useAuthStore } from '../hooks/useAuth'
import { useAppStore, parseTheme } from '../lib/store'
import { api, listApi } from '../lib/api'
import { getOwnerToken } from '../lib/ownerToken'
import { getAnonIdentity, hasSetAnonIdentity } from '../lib/anonIdentity'
import { recordRecentList } from '../hooks/useRecentLists'
import type { List, Module } from '../types/list.types'

type FetchState = 'idle' | 'loading' | 'not_found' | 'forbidden'

export default function ListPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const adminView = (location.state as { fromAdmin?: boolean } | null)?.fromAdmin === true
  const user = useAuthStore(s => s.user)
  const localList = useListById(id ?? '')
  const importList = useAppStore(s => s.importList)
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [remoteList, setRemoteList] = useState<List | null>(null)
  const [showIdentitySheet, setShowIdentitySheet] = useState(false)

  useEffect(() => {
    if (!id || localList) return
    const ownerToken = getOwnerToken()
    const qs = ownerToken ? `?ownerToken=${encodeURIComponent(ownerToken)}` : ''
    setFetchState('loading')
    api.get<List>(`/lists/${id}${qs}`)
      .then(async data => {
        const list: List = { ...data, background: data.background ?? { type: 'color', value: '' } }
        const isOwner = user
          ? list.ownerId === user.id
          : !!list.ownerToken && list.ownerToken === ownerToken
        if (isOwner) {
          await importList(list)
        } else {
          setRemoteList(list)
          if (user) {
            recordRecentList({ id: list.id, title: list.title, ownerUsername: list.ownerUsername, updatedAt: list.updatedAt })
          }
          if (!user && !hasSetAnonIdentity()) {
            setShowIdentitySheet(true)
          }
        }
        setFetchState('idle')
      })
      .catch((e: Error) => {
        const msg = e.message.toLowerCase()
        setFetchState(msg.includes('forbidden') || msg.includes('403') ? 'forbidden' : 'not_found')
      })
  }, [id, localList, user, importList])

  const list = localList ?? remoteList
  const ownerToken = getOwnerToken()
  const canEdit = list
    ? (user ? list.ownerId === user.id : !!list.ownerToken && list.ownerToken === ownerToken)
    : false

  // Apply owner's theme when viewing someone else's list; restore on leave
  useEffect(() => {
    if (canEdit || adminView || !list?.ownerTheme) return
    const prev = document.documentElement.dataset.theme
    document.documentElement.dataset.theme = parseTheme(list.ownerTheme)
    return () => { document.documentElement.dataset.theme = parseTheme(prev ?? 'clay-light') }
  }, [canEdit, adminView, list?.ownerTheme])

  // Non-owner collaborative module update: optimistic local state + PATCH to server
  const handleRemoteModuleUpdate = useCallback((module: Module) => {
    setRemoteList(prev => prev
      ? { ...prev, modules: prev.modules.map(m => m.id === module.id ? module : m) }
      : prev
    )
    void listApi.patchModule(list!.id, module).catch(() => undefined)
  }, [list])

  if (!id) return <ListNotFound />

  if (fetchState === 'loading') {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        加载中…
      </div>
    )
  }

  if (fetchState === 'forbidden') {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        无权限访问此清单
      </div>
    )
  }

  if (!list) return <ListNotFound />

  return (
    <>
      {showIdentitySheet && (
        <AnonIdentitySheet
          initial={getAnonIdentity()}
          onDone={() => setShowIdentitySheet(false)}
        />
      )}
      <ListView
        list={list}
        canEdit={canEdit}
        adminView={adminView}
        onModuleUpdate={!canEdit && remoteList ? handleRemoteModuleUpdate : undefined}
      />
    </>
  )
}

function ListNotFound() {
  return (
    <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
      清单不存在或已删除
    </div>
  )
}
