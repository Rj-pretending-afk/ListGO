import { useCallback, useEffect, useRef, useState } from 'react'
import { listApi } from '../lib/api'
import { useAppStore, hasPendingSync } from '../lib/store'
import type { List } from '../types/list.types'

const POLL_INTERVAL = 5000 // 5s — balances freshness vs. D1 read cost

interface ConflictState {
  remoteList: List
}

export function useListSync(list: List, ownerToken?: string) {
  const applyRemoteList = useAppStore(s => s.applyRemoteList)
  const resolveConflict = useAppStore(s => s.resolveConflict)
  const [conflict, setConflict] = useState<ConflictState | null>(null)

  // Always read the latest list without restarting the interval on every keystroke
  const listRef = useRef(list)
  useEffect(() => { listRef.current = list }, [list])

  useEffect(() => {
    // Only poll lists that are synced to the cloud (have an ownerId)
    if (!list.ownerId) return

    let timerId: ReturnType<typeof setTimeout> | null = null

    const schedule = () => {
      timerId = setTimeout(tick, POLL_INTERVAL)
    }

    const tick = async () => {
      // Skip when tab is hidden — saves D1 reads and battery
      if (document.visibilityState !== 'visible') {
        schedule()
        return
      }

      const current = listRef.current
      try {
        const data = await listApi.poll(current.id, current.version, ownerToken)
        if (data.upToDate === true) {
          schedule()
          return
        }

        const remote = data as unknown as List
        if (remote.version > current.version) {
          if (hasPendingSync(current.id)) {
            setConflict({ remoteList: remote })
          } else {
            applyRemoteList(remote)
          }
        }
      } catch {
        // Ignore transient network errors; next tick will retry
      }

      schedule()
    }

    // Also resume immediately when tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        if (timerId !== null) clearTimeout(timerId)
        void tick()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    schedule()

    return () => {
      if (timerId !== null) clearTimeout(timerId)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, list.ownerId, ownerToken, applyRemoteList])

  const handleResolve = useCallback((choice: 'local' | 'remote') => {
    if (!conflict) return
    resolveConflict(listRef.current.id, choice, conflict.remoteList)
    setConflict(null)
  }, [conflict, resolveConflict])

  return { conflict, resolveConflict: handleResolve }
}
