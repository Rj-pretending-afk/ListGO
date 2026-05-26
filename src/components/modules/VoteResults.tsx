import type { VoteOption } from '../../types/list.types'

interface VoteResultsProps {
  options: VoteOption[]
  votes: Record<string, string[]>
  voterNames?: Record<string, string>
  myVotes: string[]
  anonymous?: boolean
}

export function VoteResults({ options, votes, voterNames = {}, myVotes, anonymous = true }: VoteResultsProps) {
  const counts: Record<string, number> = {}
  options.forEach(o => { counts[o.id] = 0 })
  Object.values(votes).forEach(optionIds =>
    optionIds.forEach(oid => { if (oid in counts) counts[oid]++ })
  )
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  // Build per-option voter name lists for real-name mode
  const votersPerOption: Record<string, string[]> = {}
  if (!anonymous) {
    Object.entries(votes).forEach(([voterId, optionIds]) => {
      const name = voterNames[voterId]
      if (!name) return // anonymous or unknown voter — omit
      optionIds.forEach(oid => {
        if (!(oid in votersPerOption)) votersPerOption[oid] = []
        votersPerOption[oid].push(name)
      })
    })
  }

  return (
    <div className="space-y-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
      {options.map(opt => {
        const count = counts[opt.id] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const voted = myVotes.includes(opt.id)
        const voters = votersPerOption[opt.id] ?? []
        return (
          <div key={opt.id}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: voted ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: voted ? 600 : 400 }}>
                {opt.text || '（未填写）'}
              </span>
              <span style={{ color: 'var(--color-text)', opacity: 0.5 }}>{count} 票 · {pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: voted ? 'var(--color-primary)' : 'var(--color-text)',
                  opacity: voted ? 1 : 0.25,
                }}
              />
            </div>
            {/* Voter names — only in real-name mode */}
            {!anonymous && voters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {voters.map(name => (
                  <span
                    key={name}
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        共 {total} 票
      </p>
    </div>
  )
}
