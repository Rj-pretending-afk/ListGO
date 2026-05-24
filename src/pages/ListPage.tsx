import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ListView } from '../components/List/ListView'
import { AnonIdentitySheet } from '../components/ui/AnonIdentitySheet'
import { useListById } from '../hooks/useList'
import { useAuthStore } from '../hooks/useAuth'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { getOwnerToken } from '../lib/ownerToken'
import { getAnonIdentity, hasSetAnonIdentity } from '../lib/anonIdentity'
import type { List } from '../types/list.types'

type FetchState = 'idle' | 'loading' | 'not_found' | 'forbidden'

export default function ListPage() {
  const { id } = useParams<{ id: string }>()
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
        const list: List = { background: { type: 'color', value: '' }, ...data }
        const isOwner = user
          ? list.ownerId === user.id
          : !!list.ownerToken && list.ownerToken === ownerToken
        if (isOwner) {
          await importList(list)
        } else {
          setRemoteList(list)
          // Prompt anonymous (non-logged-in) visitors to pick an identity
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
      <ListView list={list} canEdit={canEdit} />
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
