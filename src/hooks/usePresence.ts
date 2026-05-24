import { useEffect, useRef, useState } from 'react'
import { presenceApi } from '../lib/api'
import type { PresenceUser } from '../lib/api'
import { useAuthStore } from './useAuth'
import { getAnonVoterId } from '../lib/anonId'
import { getAnonIdentity, getAnonDisplayName } from '../lib/anonIdentity'

const HEARTBEAT_INTERVAL = 10_000

export function usePresence(listId: string) {
  const { user } = useAuthStore()
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])
  const listIdRef = useRef(listId)
  useEffect(() => { listIdRef.current = listId }, [listId])

  useEffect(() => {
    if (!listId) return

    const isAnon = !user
    const anonId = isAnon ? getAnonVoterId() : undefined
    const identity = isAnon ? getAnonIdentity() : null

    const joinData = {
      color:       user?.avatarColor ?? identity?.color ?? '#10B981',
      displayName: user ? (user.displayName || user.username) : (identity ? getAnonDisplayName(identity) : undefined),
      isAnonymous: isAnon,
      ...(isAnon && anonId ? { anonId } : {}),
    }

    let timerId: ReturnType<typeof setInterval> | null = null

    const heartbeat = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const users = await presenceApi.join(listIdRef.current, joinData)
        setActiveUsers(users)
      } catch { /* ignore transient errors */ }
    }

    // Join immediately, then on interval
    void heartbeat()
    timerId = setInterval(heartbeat, HEARTBEAT_INTERVAL)

    const onVisible = () => { if (document.visibilityState === 'visible') void heartbeat() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (timerId !== null) clearInterval(timerId)
      document.removeEventListener('visibilitychange', onVisible)
      // Best-effort leave; fire and forget
      void presenceApi.leave(listId, anonId).catch(() => undefined)
    }
  }, [listId, user])

  return { activeUsers }
}
