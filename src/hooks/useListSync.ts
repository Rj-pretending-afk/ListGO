import { useCallback, useEffect, useRef, useState } from 'react'
import { listApi } from '../lib/api'
import { useAppStore, hasPendingSync } from '../lib/store'
import type { List } from '../types/list.types'

interface ConflictState {
  remoteList: List
}

export function useListSync(list: List, ownerToken?: string) {
  const applyRemoteList   = useAppStore(s => s.applyRemoteList)
  const resolveConflict   = useAppStore(s => s.resolveConflict)
  const [conflict, setConflict] = useState<ConflictState | null>(null)

  // Always read the latest list without restarting the interval on every keystroke
  const listRef = useRef(list)
  useEffect(() => { listRef.current = list }, [list])

  useEffect(() => {
    // Only poll lists that are synced to the cloud (have an ownerId)
    if (!list.ownerId) return

    const poll = async () => {
      const current = listRef.current
      try {
        const data = await listApi.poll(current.id, current.version, ownerToken)
        if (data.upToDate === true) return

        const remote = data as unknown as List
        if (remote.version <= current.version) return

        if (hasPendingSync(current.id)) {
          // Local edits haven't been pushed yet — ask the user
          setConflict({ remoteList: remote })
        } else {
          // No local edits pending, silently adopt the remote version
          applyRemoteList(remote)
        }
      } catch {
        // Ignore transient network errors; next tick will retry
      }
    }

    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
    // Intentionally excludes list.version so the interval doesn't restart on every sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, list.ownerId, ownerToken, applyRemoteList])

  const handleResolve = useCallback((choice: 'local' | 'remote') => {
    if (!conflict) return
    resolveConflict(listRef.current.id, choice, conflict.remoteList)
    setConflict(null)
  }, [conflict, resolveConflict])

  return { conflict, resolveConflict: handleResolve }
}
