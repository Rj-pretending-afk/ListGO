interface Stats {
  users: number; lists: number
  codesTotal: number; codesUsed: number; codesAvail: number
}

interface AdminOverviewProps { stats: Stats | null }

export function AdminOverview({ stats }: AdminOverviewProps) {
  if (!stats) return null
  const items = [
    { label: '用户数', val: stats.users },
    { label: '清单数', val: stats.lists },
    { label: '邀请码总量', val: stats.codesTotal },
    { label: '已使用', val: stats.codesUsed },
    { label: '可用', val: stats.codesAvail },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map(({ label, val }) => (
        <div key={label} className="rounded-xl p-4 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{val}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text)', opacity: 0.5 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}
