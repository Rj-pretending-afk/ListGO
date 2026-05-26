import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, adminApi } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { AdminOverview } from '../components/admin/AdminOverview'
import { AdminUsers } from '../components/admin/AdminUsers'
import type { AdminUser } from '../components/admin/AdminUsers'
import { AdminCodes } from '../components/admin/AdminCodes'
import { AdminInviteRequests } from '../components/admin/AdminInviteRequests'
import type { InviteRequestInfo } from '../types/user.types'

interface Stats {
  users: number; lists: number
  codesTotal: number; codesUsed: number; codesAvail: number
  pendingInviteRequests: number
}

interface AdminCode {
  code: string
  ownerId: string | null; ownerUsername: string | null
  usedById: string | null; usedByUsername: string | null
  usedAt: number | null; revoked: boolean; createdAt: number
}

type Tab = 'overview' | 'users' | 'codes' | 'requests'

export default function AdminPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const expandUserId = (location.state as { expandUserId?: string } | null)?.expandUserId
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.authLoading)
  const [tab, setTab] = useState<Tab>(expandUserId ? 'users' : 'requests')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [codes, setCodes] = useState<AdminCode[]>([])
  const [requests, setRequests] = useState<InviteRequestInfo[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const isSuperAdmin = user?.isSuperAdmin ?? false

  useEffect(() => {
    if (authLoading) return
    if (!user?.isAdmin) { navigate('/'); return }
    void loadAll()
  }, [user, authLoading, navigate])

  const loadAll = async () => {
    setLoadError(null)
    try {
      const [s, r] = await Promise.all([
        api.get<Stats>('/admin/stats'),
        adminApi.getInviteRequests(),
      ])
      setStats(s); setRequests(r)

      if (isSuperAdmin) {
        const [u, c] = await Promise.all([
          adminApi.getUsers(),
          api.get<AdminCode[]>('/admin/invite-codes'),
        ])
        setUsers(u); setCodes(c)
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  if (authLoading || !user?.isAdmin) return null

  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  const allTabs: { id: Tab; label: string; badge?: number; superOnly?: boolean }[] = [
    { id: 'requests', label: '邀请申请', badge: stats?.pendingInviteRequests },
    { id: 'overview', label: '概览', superOnly: true },
    { id: 'users',    label: '用户', superOnly: true },
    { id: 'codes',    label: '邀请码', superOnly: true },
  ]
  const tabs = allTabs.filter(t => !t.superOnly || isSuperAdmin)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={cardStyle}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all relative"
            style={{
              backgroundColor: tab === tb.id ? 'var(--color-primary)' : 'transparent',
              color: tab === tb.id ? 'white' : 'var(--color-text)',
              opacity: tab === tb.id ? 1 : 0.55,
            }}>
            {tb.label}
            {!!tb.badge && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] flex items-center justify-center font-bold"
                style={{ backgroundColor: '#ef4444', color: 'white' }}>
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
          加载失败：{loadError}
        </div>
      )}

      {tab === 'requests' && <AdminInviteRequests requests={requests} onRefresh={loadAll} />}
      {tab === 'overview' && isSuperAdmin && <AdminOverview stats={stats} />}
      {tab === 'users'    && isSuperAdmin && <AdminUsers users={users} onRefresh={loadAll} expandUserId={expandUserId} />}
      {tab === 'codes'    && isSuperAdmin && <AdminCodes codes={codes} onRefresh={loadAll} />}
    </div>
  )
}
