import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, adminApi } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { AdminOverview } from '../components/admin/AdminOverview'
import { AdminUsers } from '../components/admin/AdminUsers'
import type { AdminUser } from '../components/admin/AdminUsers'
import { AdminCodes } from '../components/admin/AdminCodes'

interface Stats {
  users: number; lists: number
  codesTotal: number; codesUsed: number; codesAvail: number
}

interface AdminCode {
  code: string
  ownerId: string | null; ownerUsername: string | null
  usedById: string | null; usedByUsername: string | null
  usedAt: number | null; revoked: boolean; createdAt: number
}

type Tab = 'overview' | 'users' | 'codes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: '概览' },
  { id: 'users',    label: '用户' },
  { id: 'codes',    label: '邀请码' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const expandUserId = (location.state as { expandUserId?: string } | null)?.expandUserId
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.authLoading)
  const [tab, setTab] = useState<Tab>(expandUserId ? 'users' : 'overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [codes, setCodes] = useState<AdminCode[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user?.isAdmin) { navigate('/'); return }
    void loadAll()
  }, [user, authLoading, navigate])

  const loadAll = async () => {
    setLoadError(null)
    try {
      const [s, u, c] = await Promise.all([
        api.get<Stats>('/admin/stats'),
        adminApi.getUsers(),
        api.get<AdminCode[]>('/admin/invite-codes'),
      ])
      setStats(s); setUsers(u); setCodes(c)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  if (authLoading || !user?.isAdmin) return null

  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={cardStyle}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.id ? 'var(--color-primary)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--color-text)',
              opacity: tab === t.id ? 1 : 0.55,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
          加载失败：{loadError}
        </div>
      )}

      {tab === 'overview' && <AdminOverview stats={stats} />}
      {tab === 'users'    && <AdminUsers users={users} onRefresh={loadAll} expandUserId={expandUserId} />}
      {tab === 'codes'    && <AdminCodes codes={codes} onRefresh={loadAll} />}
    </div>
  )
}
