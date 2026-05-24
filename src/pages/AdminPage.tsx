import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, adminApi } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { useT } from '../hooks/useLang'

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

interface AdminUser {
  id: string; username: string; displayName: string | null
  isAdmin: boolean; createdAt: number; listCount: number
}

interface UserList {
  id: string; title: string; permission: string; version: number; updated_at: number
}

export default function AdminPage() {
  const t = useT()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.authLoading)

  const [stats, setStats]   = useState<Stats | null>(null)
  const [codes, setCodes]   = useState<AdminCode[]>([])
  const [count, setCount]   = useState(5)
  const [generating, setGenerating] = useState(false)
  const [newCodes, setNewCodes] = useState<string[]>([])
  const [revoking, setRevoking] = useState<string | null>(null)
  const [users, setUsers]   = useState<AdminUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [userLists, setUserLists] = useState<UserList[]>([])
  const [loadingUserLists, setLoadingUserLists] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user?.isAdmin) { navigate('/'); return }
    void loadData()
  }, [user, authLoading, navigate])

  const loadData = async () => {
    const [s, c, u] = await Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<AdminCode[]>('/admin/invite-codes'),
      adminApi.getUsers(),
    ])
    setStats(s); setCodes(c); setUsers(u)
  }

  const openUserLists = async (u: AdminUser) => {
    setSelectedUser(u)
    setUserLists([])
    setLoadingUserLists(true)
    try {
      const lists = await adminApi.getUserLists(u.id)
      setUserLists(lists)
    } finally {
      setLoadingUserLists(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true); setNewCodes([])
    try {
      const res = await api.post<{ ok: boolean; codes: string[] }>('/admin/invite-codes', { count })
      setNewCodes(res.codes)
      void loadData()
    } finally { setGenerating(false) }
  }

  const handleRevoke = async (code: string) => {
    setRevoking(code)
    try {
      await api.delete(`/admin/invite-codes/${code}`)
      setCodes(prev => prev.map(c => c.code === code ? { ...c, revoked: true } : c))
    } finally { setRevoking(null) }
  }

  if (authLoading) return null
  if (!user?.isAdmin) return null

  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{t('adminTitle')}</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: t('adminUsers'),      val: stats.users },
            { label: t('adminLists'),      val: stats.lists },
            { label: t('adminCodes'),      val: stats.codesTotal },
            { label: t('adminCodesUsed'),  val: stats.codesUsed },
            { label: t('adminCodesAvail'), val: stats.codesAvail },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={cardStyle}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{val}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Generate */}
      <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('adminGenerate')}</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{t('adminCountLabel')}</label>
          <input
            type="number" min={1} max={50} value={count}
            onChange={e => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
            className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {generating ? t('adminGenerating') : t('adminGenConfirm')}
          </button>
        </div>
        {newCodes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {newCodes.map(c => (
              <code key={c} className="px-2 py-1 rounded text-xs font-mono tracking-widest"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                {c}
              </code>
            ))}
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>用户管理</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', opacity: 0.5 }}>
                {['用户名', '昵称', '清单数', '管理员', '注册时间', '操作']
                  .map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-2 font-mono" style={{ color: 'var(--color-text)' }}>{u.username}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{u.displayName ?? '—'}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{u.listCount}</td>
                  <td className="px-4 py-2" style={{ color: u.isAdmin ? 'var(--color-primary)' : 'var(--color-text)', opacity: u.isAdmin ? 1 : 0.35 }}>
                    {u.isAdmin ? '✓' : '—'}
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => openUserLists(u)}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      查看清单
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User lists modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {selectedUser.username} 的清单
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-xs hover:opacity-60"
                style={{ color: 'var(--color-text)', opacity: 0.4 }}
              >
                关闭
              </button>
            </div>
            <div className="overflow-y-auto max-h-96">
              {loadingUserLists ? (
                <p className="text-center py-8 text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>加载中…</p>
              ) : userLists.length === 0 ? (
                <p className="text-center py-8 text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>暂无清单</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {userLists.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>{l.title}</td>
                        <td className="px-5 py-3" style={{ color: 'var(--color-text)', opacity: 0.4 }}>{l.permission}</td>
                        <td className="px-5 py-3">
                          <a
                            href={`/l/${l.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:opacity-70"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            打开
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Codes table */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('adminCodesSection')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', opacity: 0.5 }}>
                {[t('adminCodeCol'), t('adminOwnerCol'), t('adminUsedByCol'), t('adminStatusCol'), t('adminActionsCol')]
                  .map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {codes.map(c => {
                const status = c.usedById ? t('adminStatusUsed')
                  : c.revoked ? t('adminStatusRevoked')
                  : t('adminStatusAvail')
                const statusColor = c.usedById ? 'var(--color-text)' : c.revoked ? '#ef4444' : 'var(--color-primary)'
                return (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2 font-mono tracking-widest" style={{ color: 'var(--color-text)' }}>{c.code}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                      {c.ownerUsername ?? '—'}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                      {c.usedByUsername ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span style={{ color: statusColor }}>{status}</span>
                    </td>
                    <td className="px-4 py-2">
                      {!c.usedById && !c.revoked && (
                        <button
                          onClick={() => handleRevoke(c.code)}
                          disabled={revoking === c.code}
                          className="hover:opacity-70 disabled:opacity-30"
                          style={{ color: '#ef4444' }}>
                          {revoking === c.code ? t('adminRevoking') : t('adminRevoke')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
