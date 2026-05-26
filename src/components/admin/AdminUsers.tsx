import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Trash2, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { AvatarDisplay } from '../ui/AvatarDisplay'

export interface AdminUser {
  id: string; username: string; displayName: string | null
  avatarColor: string; avatarImage?: string
  isAdmin: boolean; createdAt: number; listCount: number
}

export interface UserList {
  id: string; title: string; permission: string; version: number; updated_at: number
}

interface AdminUsersProps {
  users: AdminUser[]
  onRefresh: () => void
  expandUserId?: string
}

const PERM_LABEL: Record<string, string> = {
  public: '公开', verified: '登录可见', invite_only: '受邀', private: '私密',
}

function UserRow({ user, onRefresh, initialExpanded = false }: {
  user: AdminUser; onRefresh: () => void; initialExpanded?: boolean
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(initialExpanded)
  const [lists, setLists] = useState<UserList[] | null>(null)
  const [loadingLists, setLoadingLists] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(user.displayName ?? '')
  const [pwOpen, setPwOpen] = useState(false)
  const [pwDraft, setPwDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [deletingList, setDeletingList] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  const fetchLists = async () => {
    if (lists !== null) return
    setLoadingLists(true)
    try { setLists(await adminApi.getUserLists(user.id)) }
    finally { setLoadingLists(false) }
  }

  const toggleExpand = () => {
    const next = !expanded
    setExpanded(next)
    if (next) void fetchLists()
  }

  // Auto-expand and scroll into view when initialExpanded is set
  useEffect(() => {
    if (initialExpanded) {
      void fetchLists()
      setTimeout(() => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveName = async () => {
    setEditingName(false)
    const trimmed = nameDraft.trim()
    if (trimmed === (user.displayName ?? '')) return
    await adminApi.setDisplayName(user.id, trimmed)
    onRefresh()
  }

  const toggleAdmin = async () => {
    setBusy(true)
    try { await adminApi.setAdmin(user.id, !user.isAdmin); onRefresh() }
    finally { setBusy(false) }
  }

  const resetPw = async () => {
    if (pwDraft.length < 8) return
    setBusy(true)
    try { await adminApi.resetPassword(user.id, pwDraft); setPwOpen(false); setPwDraft('') }
    finally { setBusy(false) }
  }

  const deleteUser = async () => {
    if (!confirm(`删除用户 ${user.username} 及其所有清单？此操作不可撤销。`)) return
    setBusy(true)
    try { await adminApi.deleteUser(user.id); onRefresh() }
    finally { setBusy(false) }
  }

  const deleteList = async (listId: string) => {
    if (!confirm('删除此清单？不可撤销。')) return
    setDeletingList(listId)
    try {
      await adminApi.deleteList(listId)
      setLists(prev => prev?.filter(l => l.id !== listId) ?? null)
      onRefresh()
    } finally { setDeletingList(null) }
  }

  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  return (
    <div ref={rowRef} className="rounded-xl overflow-hidden" style={cardStyle}>
      {/* User header row */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <AvatarDisplay user={user} size={32} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-medium" style={{ color: 'var(--color-text)' }}>{user.username}</span>
            {user.isAdmin && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
                管理员
              </span>
            )}
          </div>
          {editingName ? (
            <input autoFocus value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') void saveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="text-xs bg-transparent outline-none border-b mt-0.5 w-40"
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-primary)' }}
              placeholder="昵称（可空）"
            />
          ) : (
            <button onClick={() => { setNameDraft(user.displayName ?? ''); setEditingName(true) }}
              className="text-xs hover:opacity-70 text-left"
              style={{ color: 'var(--color-text)', opacity: 0.45 }}>
              {user.displayName || '点击设置昵称'}
            </button>
          )}
        </div>

        <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.35 }}>{user.listCount} 个清单</span>
        <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
          {new Date(user.createdAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1">
          <button onClick={() => void toggleAdmin()} disabled={busy} title={user.isAdmin ? '撤销管理员' : '设为管理员'}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
            style={{ color: user.isAdmin ? 'var(--color-primary)' : 'var(--color-text)' }}>
            {user.isAdmin ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
          </button>
          <button onClick={() => { setPwOpen(v => !v); setPwDraft('') }} title="重置密码"
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)', opacity: 0.6 }}>
            <KeyRound size={15} />
          </button>
          <button onClick={() => void deleteUser()} disabled={busy} title="删除用户"
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
            style={{ color: '#ef4444' }}>
            <Trash2 size={15} />
          </button>
          <button onClick={toggleExpand}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)', opacity: 0.5 }}>
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </div>

      {/* Password reset inline form */}
      {pwOpen && (
        <div className="flex items-center gap-2 px-4 pb-3">
          <input type="password" value={pwDraft} onChange={e => setPwDraft(e.target.value)}
            placeholder="新密码（≥8位）" autoFocus
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onKeyDown={e => { if (e.key === 'Enter') void resetPw() }} />
          <button onClick={() => void resetPw()} disabled={busy || pwDraft.length < 8}
            className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {busy ? '保存…' : '确认'}
          </button>
          <button onClick={() => setPwOpen(false)} className="text-xs hover:opacity-60"
            style={{ color: 'var(--color-text)', opacity: 0.4 }}>取消</button>
        </div>
      )}

      {/* Expanded list panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {loadingLists ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text)', opacity: 0.4 }}>加载中…</p>
          ) : lists?.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text)', opacity: 0.4 }}>暂无清单</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {lists?.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>{l.title || '（无标题）'}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
                      {PERM_LABEL[l.permission] ?? l.permission}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
                      v{l.version} · {new Date(l.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/admin/list/${l.id}`)}
                          className="hover:opacity-70 font-medium" style={{ color: 'var(--color-primary)' }}>
                          打开
                        </button>
                        <button onClick={() => void deleteList(l.id)} disabled={deletingList === l.id}
                          className="hover:opacity-70 disabled:opacity-30" style={{ color: '#ef4444' }}>
                          {deletingList === l.id ? '…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminUsers({ users, onRefresh, expandUserId }: AdminUsersProps) {
  const [search, setSearch] = useState('')
  const filtered = search.trim()
    ? users.filter(u => u.username.includes(search) || (u.displayName ?? '').includes(search))
    : users

  return (
    <div className="space-y-3">
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜索用户名 / 昵称…"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
      {filtered.map(u => (
        <UserRow key={u.id} user={u} onRefresh={onRefresh} initialExpanded={u.id === expandUserId} />
      ))}
      {filtered.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text)', opacity: 0.35 }}>无匹配用户</p>
      )}
    </div>
  )
}
