import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { generateItemId } from '../../lib/shortid'
import type { VoteModule as VoteModuleType, VoteOption } from '../../types/list.types'
import { VoteResults } from './VoteResults'
import { IMEInput } from '../ui/IMEInput'
import { useT } from '../../hooks/useLang'
import { contentFontStyle } from '../ui/ContentFormattingBar'
import type { ContentFontSettings } from '../../types/list.types'
import { voteApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'
import { useAppStore } from '../../lib/store'
import { getAnonVoterId } from '../../lib/anonId'
import { getAnonIdentity, getAnonDisplayName } from '../../lib/anonIdentity'

interface VoteModuleProps {
  module: VoteModuleType
  onChange: (module: VoteModuleType) => void
  listId: string
  contentFontSettings?: ContentFontSettings
  canEdit?: boolean
}

export function VoteModule({ module, onChange, listId, contentFontSettings, canEdit = true }: VoteModuleProps) {
  const t = useT()
  const cfStyle = contentFontStyle(contentFontSettings)
  const { user } = useAuthStore()
  const patchModuleVotes = useAppStore(s => s.patchModuleVotes)
  const isAnon = !user
  const voterId = user?.id ?? getAnonVoterId()

  // Local state — updated optimistically; reset when store updates (e.g. from polling)
  const [localVotes, setLocalVotes] = useState(module.votes)
  const [localVoterNames, setLocalVoterNames] = useState(module.voterNames ?? {})
  useEffect(() => { setLocalVotes(module.votes) }, [module.votes])
  useEffect(() => { setLocalVoterNames(module.voterNames ?? {}) }, [module.voterNames])

  const myVotes = localVotes[voterId] ?? []
  const totalVotes = Object.values(localVotes).reduce((sum, ids) => sum + ids.length, 0)
  const update = (patch: Partial<VoteModuleType>) => onChange({ ...module, ...patch })

  const castVote = async (optionId: string) => {
    const next = module.multiSelect
      ? myVotes.includes(optionId) ? myVotes.filter(id => id !== optionId) : [...myVotes, optionId]
      : myVotes.includes(optionId) ? [] : [optionId]

    // Optimistic update so the UI feels instant
    setLocalVotes(v => ({ ...v, [voterId]: next }))

    try {
      const displayName = !isAnon
        ? (user?.displayName ?? user?.username)
        : getAnonDisplayName(getAnonIdentity())
      const result = await voteApi.cast(module.id, listId, next, voterId, isAnon, displayName)
      setLocalVotes(result.votes)
      setLocalVoterNames(result.voterNames ?? {})
      patchModuleVotes(listId, module.id, result.votes, result.voterNames ?? {}, result.version)
    } catch {
      setLocalVotes(module.votes)
      setLocalVoterNames(module.voterNames ?? {})
    }
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
          { label: module.multiSelect ? t('voteMulti') : t('voteSingle'), active: module.multiSelect, onClick: () => canEdit && update({ multiSelect: !module.multiSelect }) },
          { label: module.anonymous   ? t('voteAnon')  : t('voteReal'),   active: module.anonymous,   onClick: () => canEdit && update({ anonymous:   !module.anonymous   }) },
        ].map(({ label, active, onClick }) => (
          <button key={label} onClick={onClick} disabled={!canEdit}
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
              {/* Touch target wrapper: visually 20×20 but tappable 44×44 */}
              <button onClick={() => castVote(opt.id)}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 44, height: 44, margin: -12 }}>
                <span
                  className="w-5 h-5 border-2 transition-all block"
                  style={{
                    borderColor: voted ? 'var(--color-primary)' : 'var(--color-text)',
                    backgroundColor: voted ? 'var(--color-primary)' : 'transparent',
                    borderRadius: module.multiSelect ? '4px' : '50%',
                    opacity: voted ? 1 : 0.55,
                  }} />
              </button>
              <IMEInput value={opt.text}
                onChange={v => canEdit && update({ options: module.options.map(o => o.id === opt.id ? { ...o, text: v } : o) })}
                readOnly={!canEdit}
                placeholder={t('voteOption')}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ ...cfStyle, color: cfStyle.color ?? 'var(--color-text)' }} />
              {canEdit && module.options.length > 2 && (
                <button onClick={() => removeOption(opt.id)}
                  className="opacity-20 group-hover:opacity-100 [@media(hover:none)]:opacity-50 transition-opacity flex-shrink-0 p-2 -m-2"
                  style={{ color: 'var(--color-text)' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
        {canEdit && (
          <button onClick={addOption} className="flex items-center gap-1 text-xs mt-1 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-primary)', opacity: 0.75 }}>
            <Plus size={12} /> {t('voteAddOption')}
          </button>
        )}
      </div>

      {totalVotes > 0 && (
        <VoteResults
          options={module.options}
          votes={localVotes}
          voterNames={localVoterNames}
          myVotes={myVotes}
          anonymous={module.anonymous}
        />
      )}
    </div>
  )
}
