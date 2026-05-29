import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, ImagePlus, Link, X, AlignLeft } from 'lucide-react'
import { generateItemId } from '../../lib/shortid'
import type { VoteModule as VoteModuleType, VoteOption } from '../../types/list.types'
import { VoteResults } from './VoteResults'
import { VoteDescriptionEditor } from './VoteDescriptionEditor'
import { IMEInput } from '../ui/IMEInput'
import { ImageResizeOverlay } from '../editor/ImageResizeOverlay'
import { CropModal } from '../editor/CropModal'
import { useT } from '../../hooks/useLang'
import { contentFontStyle } from '../../lib/contentFontStyle'
import type { ContentFontSettings } from '../../types/list.types'
import { voteApi, uploadApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuth'
import { useAppStore } from '../../lib/store'
import { getAnonVoterId } from '../../lib/anonId'
import { getAnonIdentity, getAnonDisplayName } from '../../lib/anonIdentity'
import { resizeDataUrl } from '../../lib/imageUtils'

const OPT_IMG_DEFAULT = 200 // default option image width in px

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

  const [localVotes, setLocalVotes] = useState(module.votes)
  const [localVoterNames, setLocalVoterNames] = useState(module.voterNames ?? {})
  useEffect(() => { setLocalVotes(module.votes) }, [module.votes])
  useEffect(() => { setLocalVoterNames(module.voterNames ?? {}) }, [module.voterNames])

  // Description editor visibility
  const [showDesc, setShowDesc] = useState(!!module.description)

  // Per-option image picker
  const [imgPickerOpen, setImgPickerOpen] = useState<string | null>(null)
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  // Per-option image resize / crop
  const imgRefs = useRef<Record<string, HTMLImageElement | null>>({})
  const originalOptImages = useRef<Record<string, string>>({})
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null)
  const [showCropFor, setShowCropFor] = useState<string | null>(null)
  // Signals VoteDescriptionEditor to clear its selected image
  const [descClearKey, setDescClearKey] = useState(0)

  const myVotes = localVotes[voterId] ?? []
  const totalVotes = Object.values(localVotes).reduce((sum, ids) => sum + ids.length, 0)
  const update = (patch: Partial<VoteModuleType>) => onChange({ ...module, ...patch })
  const updateOption = (id: string, patch: Partial<VoteOption>) =>
    update({ options: module.options.map(o => o.id === id ? { ...o, ...patch } : o) })

  const castVote = async (optionId: string) => {
    const next = module.multiSelect
      ? myVotes.includes(optionId) ? myVotes.filter(id => id !== optionId) : [...myVotes, optionId]
      : myVotes.includes(optionId) ? [] : [optionId]
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

  // ── Option image upload ──
  const handleFileUpload = async (optId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (user) {
      setUploading(u => ({ ...u, [optId]: true }))
      try {
        const { url } = await uploadApi.uploadImage(file)
        updateOption(optId, { image: url, imageWidth: OPT_IMG_DEFAULT })
        setImgPickerOpen(null)
      } catch { /* silent */ }
      finally { setUploading(u => ({ ...u, [optId]: false })) }
    } else {
      const reader = new FileReader()
      reader.onload = async ev => {
        if (!ev.target?.result) return
        const src = await resizeDataUrl(ev.target.result as string)
        updateOption(optId, { image: src, imageWidth: OPT_IMG_DEFAULT })
        setImgPickerOpen(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlInsert = (optId: string) => {
    const url = urlInputs[optId]?.trim()
    if (url) {
      updateOption(optId, { image: url, imageWidth: OPT_IMG_DEFAULT })
      setUrlInputs(u => ({ ...u, [optId]: '' }))
      setImgPickerOpen(null)
    }
  }

  // ── Option image resize / crop ──
  const handleOptImageClick = (optId: string) => {
    const imgEl = imgRefs.current[optId]
    if (!imgEl) return
    if (originalOptImages.current[optId]) imgEl.dataset.originalSrc = originalOptImages.current[optId]
    setDescClearKey(k => k + 1)  // dismiss description overlay
    setSelectedOptId(optId)
  }

  const selectedImgEl = selectedOptId ? imgRefs.current[selectedOptId] ?? null : null

  const handleOptResizeEnd = () => {
    if (!selectedOptId) return
    const w = imgRefs.current[selectedOptId]?.clientWidth
    if (w) updateOption(selectedOptId, { imageWidth: w })
  }

  const handleOptCropOpen = () => {
    if (!selectedOptId) return
    const opt = module.options.find(o => o.id === selectedOptId)
    if (!opt?.image) return
    if (!originalOptImages.current[selectedOptId])
      originalOptImages.current[selectedOptId] = opt.image
    setShowCropFor(selectedOptId)
  }

  const handleOptCropConfirm = (dataUrl: string) => {
    if (!showCropFor) return
    updateOption(showCropFor, { image: dataUrl, imageWidth: OPT_IMG_DEFAULT })
    setShowCropFor(null)
    setSelectedOptId(null)
  }

  const handleOptRestore = () => {
    if (!selectedOptId) return
    const original = originalOptImages.current[selectedOptId]
    if (!original) return
    delete originalOptImages.current[selectedOptId]
    updateOption(selectedOptId, { image: original, imageWidth: OPT_IMG_DEFAULT })
    setSelectedOptId(null)
  }

  const handleOptRemoveImg = () => {
    if (!selectedOptId) return
    delete originalOptImages.current[selectedOptId]
    updateOption(selectedOptId, { image: undefined, imageWidth: undefined })
    setSelectedOptId(null)
  }

  const cropSrc = showCropFor
    ? (module.options.find(o => o.id === showCropFor)?.image ?? null)
    : null

  return (
    <div onClick={() => setSelectedOptId(null)}>
      {/* ── Description (rich text) ── */}
      {canEdit && !showDesc && (
        <button
          onClick={e => { e.stopPropagation(); setShowDesc(true) }}
          className="flex items-center gap-1 text-xs mb-3 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text)', opacity: 0.35 }}
        >
          <AlignLeft size={12} /> {module.description ? '展开描述' : '添加描述'}
        </button>
      )}
      {(showDesc || (!canEdit && module.description)) && (
        <VoteDescriptionEditor
          value={module.description ?? ''}
          onChange={v => update({ description: v || undefined })}
          canEdit={canEdit}
          contentFontSettings={contentFontSettings}
          onClose={canEdit ? () => setShowDesc(false) : undefined}
          onActivate={() => setSelectedOptId(null)}
          clearKey={descClearKey}
        />
      )}

      {/* ── Vote controls ── */}
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

      {/* ── Options ── */}
      <div className="space-y-2 mt-3">
        {module.options.map(opt => {
          const voted = myVotes.includes(opt.id)
          const pickerOpen = imgPickerOpen === opt.id
          const isUploading = uploading[opt.id]

          return (
            <div key={opt.id} className="space-y-1" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 group">
                <button onClick={() => castVote(opt.id)}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 44, height: 44, margin: -12 }}>
                  <span className="w-5 h-5 border-2 transition-all block" style={{
                    borderColor: voted ? 'var(--color-primary)' : 'var(--color-text)',
                    backgroundColor: voted ? 'var(--color-primary)' : 'transparent',
                    borderRadius: module.multiSelect ? '4px' : '50%',
                    opacity: voted ? 1 : 0.55,
                  }} />
                </button>

                <IMEInput value={opt.text}
                  onChange={v => canEdit && updateOption(opt.id, { text: v })}
                  readOnly={!canEdit}
                  placeholder={t('voteOption')}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ ...cfStyle, color: cfStyle.color ?? 'var(--color-text)' }} />

                {canEdit && (
                  <button
                    onClick={() => setImgPickerOpen(pickerOpen ? null : opt.id)}
                    className="opacity-20 group-hover:opacity-60 [@media(hover:none)]:opacity-50 transition-opacity flex-shrink-0 p-1.5 -m-1.5"
                    style={{ color: pickerOpen ? 'var(--color-primary)' : 'var(--color-text)' }}
                    title="插入图片"
                  >
                    <ImagePlus size={13} />
                  </button>
                )}

                {canEdit && module.options.length > 2 && (
                  <button onClick={() => removeOption(opt.id)}
                    className="opacity-20 group-hover:opacity-100 [@media(hover:none)]:opacity-50 transition-opacity flex-shrink-0 p-2 -m-2"
                    style={{ color: 'var(--color-text)' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Option image */}
              {opt.image && (
                <div className="relative ml-8">
                  <img
                    src={opt.image}
                    ref={el => { imgRefs.current[opt.id] = el }}
                    alt=""
                    onClick={canEdit ? () => handleOptImageClick(opt.id) : undefined}
                    style={{
                      width: opt.imageWidth ?? OPT_IMG_DEFAULT,
                      maxWidth: '100%',
                      minHeight: 40,
                      borderRadius: 6,
                      display: 'block',
                      cursor: canEdit ? 'pointer' : undefined,
                      outline: selectedOptId === opt.id ? '2px solid var(--color-primary)' : undefined,
                    }}
                  />
                  {/* Quick remove when not in overlay mode */}
                  {canEdit && selectedOptId !== opt.id && (
                    <button
                      onClick={() => { delete originalOptImages.current[opt.id]; updateOption(opt.id, { image: undefined, imageWidth: undefined }) }}
                      className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-70 transition-opacity"
                      style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Image picker row */}
              {canEdit && pickerOpen && (
                <div className="ml-8 flex items-center gap-2 flex-wrap py-1.5 px-2 rounded-lg"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                  <label
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-70"
                    style={{ color: 'var(--color-text)', opacity: isUploading ? 0.35 : 0.65, pointerEvents: isUploading ? 'none' : undefined }}>
                    <ImagePlus size={12} /> {isUploading ? '上传中…' : '上传'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => handleFileUpload(opt.id, e)} disabled={isUploading} />
                  </label>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Link size={12} style={{ color: 'var(--color-text)', opacity: 0.5, flexShrink: 0 }} />
                    <input
                      value={urlInputs[opt.id] ?? ''}
                      onChange={e => setUrlInputs(u => ({ ...u, [opt.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.nativeEvent.isComposing) return
                        if (e.key === 'Enter') handleUrlInsert(opt.id)
                        if (e.key === 'Escape') setImgPickerOpen(null)
                      }}
                      placeholder="https://..."
                      className="flex-1 min-w-0 text-xs bg-transparent outline-none px-1"
                      style={{ color: 'var(--color-text)' }}
                    />
                    {urlInputs[opt.id]?.trim() && (
                      <button onClick={() => handleUrlInsert(opt.id)}
                        className="text-xs px-2 py-0.5 rounded font-medium hover:opacity-80 flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                        插入
                      </button>
                    )}
                  </div>
                </div>
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

      {/* ── Portals: resize overlay + crop modal ── */}
      {canEdit && selectedImgEl && createPortal(
        <ImageResizeOverlay
          imgEl={selectedImgEl}
          onResizeEnd={handleOptResizeEnd}
          onCrop={handleOptCropOpen}
          onRemove={handleOptRemoveImg}
          onRestore={originalOptImages.current[selectedOptId!] ? handleOptRestore : undefined}
        />,
        document.body
      )}

      {cropSrc && createPortal(
        <CropModal
          src={cropSrc}
          onConfirm={handleOptCropConfirm}
          onClose={() => setShowCropFor(null)}
        />,
        document.body
      )}
    </div>
  )
}
