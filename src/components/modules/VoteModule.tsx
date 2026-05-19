import { Plus, Trash2 } from 'lucide-react'
import { generateItemId } from '../../lib/shortid'
import type { VoteModule as VoteModuleType, VoteOption } from '../../types/list.types'
import { VoteResults } from './VoteResults'
import { IMEInput } from '../ui/IMEInput'
import { useT } from '../../hooks/useLang'
import { contentFontStyle } from '../ui/ContentFormattingBar'
import type { ContentFontSettings } from '../../types/list.types'

const LOCAL_VOTER = 'local'

interface VoteModuleProps {
  module: VoteModuleType
  onChange: (module: VoteModuleType) => void
  contentFontSettings?: ContentFontSettings
}

export function VoteModule({ module, onChange, contentFontSettings }: VoteModuleProps) {
  const t = useT()
  const cfStyle = contentFontStyle(contentFontSettings)
  const myVotes = module.votes[LOCAL_VOTER] ?? []
  const totalVotes = Object.values(module.votes).reduce((sum, ids) => sum + ids.length, 0)
  const update = (patch: Partial<VoteModuleType>) => onChange({ ...module, ...patch })

  const castVote = (optionId: string) => {
    const next = module.multiSelect
      ? myVotes.includes(optionId) ? myVotes.filter(id => id !== optionId) : [...myVotes, optionId]
      : myVotes.includes(optionId) ? [] : [optionId]
    update({ votes: { ...module.votes, [LOCAL_VOTER]: next } })
  }

  const addOption = () => update({ options: [...module.options, { id: generateItemId(), text: '' } as VoteOption] })
  const removeOption = (id: string) => {
    if (module.options.length <= 2) return
    update({
      options: module.options.filter(o => o.id !== id),
      votes: Object.fromEntries(Object.entries(module.votes).map(([k, v]) => [k, v.filter(oid => oid !== id)])),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: module.multiSelect ? t('voteMulti') : t('voteSingle'), active: module.multiSelect, onClick: () => update({ multiSelect: !module.multiSelect }) },
          { label: module.anonymous   ? t('voteAnon')  : t('voteReal'),   active: module.anonymous,   onClick: () => update({ anonymous:   !module.anonymous   }) },
        ].map(({ label, active, onClick }) => (
          <button key={label} onClick={onClick}
            className="px-2.5 py-0.5 rounded-full text-xs transition-all hover:opacity-90 select-none"
            style={{
              border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-text)'}`,
              backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 18%, transparent)' : 'color-mix(in srgb, var(--color-text) 8%, transparent)',
              color: active ? 'var(--color-primary)' : 'var(--color-text)',
              opacity: active ? 1 : 0.55,
            }}>
            {label}
          </button>
        ))}
        {totalVotes > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
            {totalVotes} {t('voteTotal')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {module.options.map(opt => {
          const voted = myVotes.includes(opt.id)
          return (
            <div key={opt.id} className="flex items-center gap-2 group">
              <button onClick={() => castVote(opt.id)}
                className="w-5 h-5 flex-shrink-0 border-2 transition-all"
                style={{
                  borderColor: voted ? 'var(--color-primary)' : 'var(--color-text)',
                  backgroundColor: voted ? 'var(--color-primary)' : 'transparent',
                  borderRadius: module.multiSelect ? '4px' : '50%',
                  opacity: voted ? 1 : 0.55,
                }} />
              <IMEInput value={opt.text}
                onChange={v => update({ options: module.options.map(o => o.id === opt.id ? { ...o, text: v } : o) })}
                placeholder={t('voteOption')}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ ...cfStyle, color: cfStyle.color ?? 'var(--color-text)' }} />
              {module.options.length > 2 && (
                <button onClick={() => removeOption(opt.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: 'var(--color-text)' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
        <button onClick={addOption} className="flex items-center gap-1 text-xs mt-1 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-primary)', opacity: 0.75 }}>
          <Plus size={12} /> {t('voteAddOption')}
        </button>
      </div>

      {totalVotes > 0 && <VoteResults options={module.options} votes={module.votes} myVotes={myVotes} />}
    </div>
  )
}
