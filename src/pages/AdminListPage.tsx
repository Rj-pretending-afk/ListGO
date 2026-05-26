import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ListView } from '../components/List/ListView'
import { useAuthStore } from '../hooks/useAuth'
import { adminApi } from '../lib/api'
import type { List } from '../types/list.types'

const PERM_LABEL: Record<string, string> = {
  public: '公开', verified: '登录可见', invite_only: '受邀可见', private: '私密',
}

export default function AdminListPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.authLoading)
  const [list, setList] = useState<(List & { ownerUsername?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user?.isAdmin) { navigate('/'); return }
    if (!id) return
    setLoading(true)
    adminApi.getList(id)
      .then(data => {
        setList({ background: { type: 'color' as const, value: '' }, ...data } as List & { ownerUsername?: string })
      })
      .catch(() => setError('清单不存在或加载失败'))
      .finally(() => setLoading(false))
  }, [id, user, authLoading, navigate])

  if (authLoading || (!list && loading)) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>加载中…</div>
  }
  if (error || !list) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>{error ?? '未知错误'}</div>
  }

  return (
    <div>
      <div className="px-4 py-2 flex items-center gap-4 flex-wrap text-xs"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>管理员视图</span>
        {list.ownerUsername && (
          <span style={{ color: 'var(--color-text)', opacity: 0.6 }}>所有者：<strong>{list.ownerUsername}</strong></span>
        )}
        <span style={{ color: 'var(--color-text)', opacity: 0.6 }}>权限：{PERM_LABEL[list.permission] ?? list.permission}</span>
        <span style={{ color: 'var(--color-text)', opacity: 0.4 }}>ID：{list.id}</span>
        <span style={{ color: 'var(--color-text)', opacity: 0.4 }}>v{list.version}</span>
      </div>
      <ListView list={list} canEdit={false} adminView={true} />
    </div>
  )
}
