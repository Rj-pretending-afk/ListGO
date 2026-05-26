import { useState } from 'react'
import { api } from '../../lib/api'

interface AdminCode {
  code: string
  ownerId: string | null; ownerUsername: string | null
  usedById: string | null; usedByUsername: string | null
  usedAt: number | null; revoked: boolean; createdAt: number
}

interface AdminCodesProps {
  codes: AdminCode[]
  onRefresh: () => void
}

export function AdminCodes({ codes, onRefresh }: AdminCodesProps) {
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [newCodes, setNewCodes] = useState<string[]>([])
  const [revoking, setRevoking] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true); setNewCodes([])
    try {
      const res = await api.post<{ ok: boolean; codes: string[] }>('/admin/invite-codes', { count })
      setNewCodes(res.codes)
      onRefresh()
    } finally { setGenerating(false) }
  }

  const handleRevoke = async (code: string) => {
    setRevoking(code)
    try { await api.delete(`/admin/invite-codes/${code}`); onRefresh() }
    finally { setRevoking(null) }
  }

  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5 space-y-3" style={cardStyle}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>生成邀请码</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.6 }}>数量</span>
          <input type="number" min={1} max={50} value={count}
            onChange={e => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
            className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {generating ? '生成中…' : '生成'}
          </button>
        </div>
        {newCodes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {newCodes.map(c => (
              <code key={c} className="px-2 py-1 rounded text-xs font-mono tracking-widest"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>{c}</code>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['邀请码', '所有者', '使用者', '状态', '操作'].map(h => (
                  <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map(c => {
                const status = c.usedById ? '已使用' : c.revoked ? '已撤销' : '可用'
                const statusColor = c.usedById ? 'var(--color-text)' : c.revoked ? '#ef4444' : 'var(--color-primary)'
                return (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2 font-mono tracking-widest" style={{ color: 'var(--color-text)' }}>{c.code}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{c.ownerUsername ?? '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{c.usedByUsername ?? '—'}</td>
                    <td className="px-4 py-2"><span style={{ color: statusColor }}>{status}</span></td>
                    <td className="px-4 py-2">
                      {!c.usedById && !c.revoked && (
                        <button onClick={() => handleRevoke(c.code)} disabled={revoking === c.code}
                          className="hover:opacity-70 disabled:opacity-30" style={{ color: '#ef4444' }}>
                          {revoking === c.code ? '撤销中…' : '撤销'}
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
