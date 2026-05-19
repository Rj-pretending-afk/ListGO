import { Plus, Trash2 } from 'lucide-react'
import { generateItemId } from '../../lib/shortid'
import type { VoteModule as VoteModuleType, VoteOption } from '../../types/list.types'
import { VoteResults } from './VoteResults'
import { IMEInput } from '../ui/IMEInput'

const LOCAL_VOTER = 'local'

interface VoteModuleProps {
  module: VoteModuleType
  onChange: (module: VoteModuleType) => void
}

export function VoteModule({ module, onChange }: VoteModuleProps) {
  const myVotes = module.votes[LOCAL_VOTER] ?? []
  const totalVotes = Object.values(module.votes).reduce((sum, ids) => sum + ids.length, 0)

  const update = (patch: Partial<VoteModuleType>) => onChange({ ...module, ...patch })

  const castVote = (optionId: string) => {
    const next = module.multiSelect
      ? myVotes.includes(optionId)
        ? myVotes.filter(id => id !== optionId)
        : [...myVotes, optionId]
      : myVotes.includes(optionId) ? [] : [optionId]
    update({ votes: { ...module.votes, [LOCAL_VOTER]: next } })
  }

  const updateOption = (id: string, text: string) =>
    update({ options: module.options.map(o => o.id === id ? { ...o, text } : o) })

  const addOption = () => {
    const opt: VoteOption = { id: generateItemId(), text: '' }
    update({ options: [...module.options, opt] })
  }

  const removeOption = (id: string) => {
    if (module.options.length <= 2) return
    update({
      options: module.options.filter(o => o.id !== id),
      // clear votes for removed option
      votes: Object.fromEntries(
        Object.entries(module.votes).map(([k, v]) => [k, v.filter(oid => oid !== id)])
      ),
    })
  }

  return (
    <div className="space-y-3">
      {/* Question */}
      <IMEInput
        value={module.question}
        onChange={v => update({ question: v })}
        placeholder="投票问题…"
        className="w-full font-medium text-sm bg-transparent outline-none"
        style={{ color: 'var(--color-text)' }}
      />

      {/* Settings row */}
      <div className="flex gap-3 text-xs select-none" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
        <button
          onClick={() => update({ multiSelect: !module.multiSelect })}
          className="hover:opacity-80 transition-opacity underline-offset-2 hover:underline"
        >
          {module.multiSelect ? '多选' : '单选'}
        </button>
        <button
          onClick={() => update({ anonymous: !module.anonymous })}
          className="hover:opacity-80 transition-opacity underline-offset-2 hover:underline"
        >
          {module.anonymous ? '匿名' : '实名'}
        </button>
        {totalVotes > 0 && <span>{totalVotes} 票</span>}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {module.options.map(opt => {
          const voted = myVotes.includes(opt.id)
          return (
            <div key={opt.id} className="flex items-center gap-2 group">
              {/* Vote button (radio/checkbox shape) */}
              <button
                onClick={() => castVote(opt.id)}
                className="w-4 h-4 flex-shrink-0 border-2 transition-colors"
                style={{
                  borderColor: voted ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: voted ? 'var(--color-primary)' : 'transparent',
                  borderRadius: module.multiSelect ? '3px' : '50%',
                }}
              />
              <IMEInput
                value={opt.text}
                onChange={v => updateOption(opt.id, v)}
                placeholder="选项…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text)' }}
              />
              {module.options.length > 2 && (
                <button
                  onClick={() => removeOption(opt.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: 'var(--color-text)' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
        <button
          onClick={addOption}
          className="flex items-center gap-1 text-xs mt-1 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)', opacity: 0.4 }}
        >
          <Plus size={12} /> 添加选项
        </button>
      </div>

      {totalVotes > 0 && (
        <VoteResults options={module.options} votes={module.votes} myVotes={myVotes} />
      )}
    </div>
  )
}
