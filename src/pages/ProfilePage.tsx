import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Plus } from 'lucide-react'
import { createPortal } from 'react-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { useT } from '../hooks/useLang'
import { AVATAR_COLORS } from '../lib/colors'
import { CropModal } from '../components/editor/CropModal'
import { resizeDataUrl } from '../lib/imageUtils'

export default function ProfilePage() {
  const t = useT()
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)

  if (!user) { navigate('/login'); return null }

  const saveName = async () => {
    if (!displayName.trim()) return
    setNameLoading(true); setNameMsg('')
    try {
      await api.put('/auth/profile', { displayName: displayName.trim() })
      updateUser({ displayName: displayName.trim() })
      setNameMsg(t('saved'))
      setTimeout(() => setNameMsg(''), 2000)
    } catch (e) {
      setNameMsg(e instanceof Error ? e.message : t('saveFailed'))
    } finally { setNameLoading(false) }
  }

  const saveColor = async (color: string) => {
    try {
      await api.put('/auth/profile', { avatarColor: color })
      updateUser({ avatarColor: color })
    } catch { /* ignore */ }
  }

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) setCropSrc(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropConfirm = async (dataUrl: string) => {
    setCropSrc(null)
    const resized = await resizeDataUrl(dataUrl, 200)
    setPendingAvatar(resized)
  }

  const savePendingAvatar = async () => {
    if (!pendingAvatar) return
    setAvatarLoading(true)
    try {
      await api.put('/auth/profile', { avatarImage: pendingAvatar })
      updateUser({ avatarImage: pendingAvatar })
      setPendingAvatar(null)
    } catch { /* ignore */ }
    finally { setAvatarLoading(false) }
  }

  const removeAvatar = async () => {
    setAvatarLoading(true)
    try {
      await api.put('/auth/profile', { avatarImage: null })
      updateUser({ avatarImage: undefined })
    } catch { /* ignore */ }
    finally { setAvatarLoading(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(''); setPwMsg('')
    if (passwords.new !== passwords.confirm) { setPwError(t('pwMismatch')); return }
    if (passwords.new.length < 8) { setPwError(t('pwTooShort')); return }
    setPwLoading(true)
    try {
      await api.put('/auth/password', { oldPassword: passwords.old, newPassword: passwords.new })
      setPasswords({ old: '', new: '', confirm: '' })
      setPwMsg(t('pwChanged'))
      setTimeout(() => setPwMsg(''), 3000)
    } catch (e) {
      setPwError(e instanceof Error ? e.message : t('changeFailed'))
    } finally { setPwLoading(false) }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const card = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }
  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm outline-none'
  const inputStyle = { backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }
  const secLabel = { color: 'var(--color-text)', opacity: 0.6 }

  const unusedCodes = user.inviteCodes.filter(c => !c.used && !c.revoked)
  const usedCodes   = user.inviteCodes.filter(c => c.used || c.revoked)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AvatarDisplay user={user} size={40} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{user.displayName}</p>
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>@{user.username}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="text-sm hover:opacity-70" style={{ color: '#ef4444' }}>
          {t('profileLogout')}
        </button>
      </div>

      {/* Avatar + color */}
      <div className="rounded-xl p-5 mb-4" style={card}>
        {/* Pending avatar preview */}
        {pendingAvatar && (
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-border)' }}>
            <img src={pendingAvatar} alt="preview"
              className="rounded-full object-cover flex-shrink-0"
              style={{ width: 52, height: 52, border: `2px solid ${user.avatarColor}` }} />
            <div className="flex flex-col gap-2 flex-1">
              <button onClick={savePendingAvatar} disabled={avatarLoading}
                className="w-full py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {avatarLoading ? t('profileProcessing') : t('profileSave')}
              </button>
              <button onClick={() => { setPendingAvatar(null); fileRef.current?.click() }}
                className="w-full py-1.5 rounded-lg text-xs hover:opacity-70"
                style={{ color: 'var(--color-text)', opacity: 0.6, border: '1px solid var(--color-border)' }}>
                {t('cropCancel')}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
          {/* Avatar — 76px */}
          <AvatarDisplay user={user} size={76} />

          {/* Button + color columns */}
          <div className="flex flex-col gap-3">
            {/* Row 1: upload + colors 0-3 */}
            <div className="flex items-center gap-4">
              <button onClick={() => fileRef.current?.click()} disabled={avatarLoading || !!pendingAvatar}
                className="w-28 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-40 text-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {t('profileUploadAvatar')}
              </button>
              <div className="flex gap-2.5">
                {AVATAR_COLORS.slice(0, 4).map(({ label, value }) => (
                  <button key={value} onClick={() => saveColor(value)} title={label}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                    style={{ backgroundColor: value, outline: user.avatarColor === value ? '3px solid var(--color-text)' : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>

            {/* Row 2: remove (or spacer) + colors 4-6 + custom */}
            <div className="flex items-center gap-4">
              {user.avatarImage ? (
                <button onClick={removeAvatar} disabled={avatarLoading}
                  className="w-28 py-1.5 rounded-lg text-xs hover:opacity-70 disabled:opacity-40 text-center flex-shrink-0"
                  style={{ color: '#ef4444', border: '1px solid var(--color-border)' }}>
                  {t('profileRemoveAvatar')}
                </button>
              ) : (
                <div className="w-28 flex-shrink-0" />
              )}
              <div className="flex gap-2.5">
                {AVATAR_COLORS.slice(4).map(({ label, value }) => (
                  <button key={value} onClick={() => saveColor(value)} title={label}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                    style={{ backgroundColor: value, outline: user.avatarColor === value ? '3px solid var(--color-text)' : 'none', outlineOffset: '2px' }} />
                ))}
                {/* Custom color — "+" centered via flex, no absolute */}
                <label className="w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform relative"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: AVATAR_COLORS.some(c => c.value === user.avatarColor) ? 'transparent' : user.avatarColor,
                  }}
                  title="Custom">
                  {AVATAR_COLORS.some(c => c.value === user.avatarColor) && (
                    <Plus size={14} strokeWidth={1.5} className="pointer-events-none"
                      style={{ color: 'var(--color-text)', opacity: 0.5 }} />
                  )}
                  <input type="color" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={user.avatarColor} onChange={e => saveColor(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
      </div>

      {/* Display name */}
      <div className="rounded-xl p-5 mb-4" style={card}>
        <p className="text-xs font-medium mb-3" style={secLabel}>{t('profileNameLabel')}</p>
        <div className="flex gap-2">
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className={inputCls} style={inputStyle} maxLength={40} />
          <button onClick={saveName} disabled={nameLoading || !displayName.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {nameLoading ? t('profileSaving') : t('profileSave')}
          </button>
        </div>
        {nameMsg && <p className="text-xs mt-2" style={{ color: 'var(--color-primary)' }}>{nameMsg}</p>}
      </div>

      {/* Invite codes */}
      <div className="rounded-xl p-5 mb-4" style={card}>
        <p className="text-xs font-medium mb-3" style={secLabel}>{t('profileCodesLabel')}</p>
        {user.inviteCodes.length === 0
          ? <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>{t('profileNoCodes')}</p>
          : (
            <div className="space-y-2">
              {unusedCodes.map(c => (
                <div key={c.code} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-border)' }}>
                  <span className="font-mono text-sm tracking-wider select-all" style={{ color: 'var(--color-text)' }}>{c.code}</span>
                  <button onClick={() => copyCode(c.code)}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:opacity-70 flex-shrink-0"
                    style={{ color: 'var(--color-primary)' }}>
                    {copiedCode === c.code ? <Check size={12} /> : <Copy size={12} />}
                    {copiedCode === c.code ? t('codeCopied') : t('codeCopy')}
                  </button>
                </div>
              ))}
              {usedCodes.map(c => (
                <div key={c.code} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-border)', opacity: 0.4 }}>
                  <span className="font-mono text-sm tracking-wider line-through" style={{ color: 'var(--color-text)' }}>{c.code}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text)' }}>
                    {c.revoked ? t('codeRevoked') : t('codeUsed')}
                  </span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Change password */}
      <div className="rounded-xl p-5 mb-4" style={card}>
        <p className="text-xs font-medium mb-3" style={secLabel}>{t('profilePwLabel')}</p>
        <form onSubmit={changePassword} className="space-y-3">
          {(['old', 'new', 'confirm'] as const).map(field => (
            <input key={field} type="password" value={passwords[field]}
              onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
              placeholder={field === 'old' ? t('profileOldPw') : field === 'new' ? t('profileNewPw') : t('profileConfirmPw')}
              className={inputCls} style={inputStyle}
              autoComplete={field === 'old' ? 'current-password' : 'new-password'} />
          ))}
          {pwError && <p className="text-xs" style={{ color: '#ef4444' }}>{pwError}</p>}
          {pwMsg  && <p className="text-xs" style={{ color: 'var(--color-primary)' }}>{pwMsg}</p>}
          <button type="submit" disabled={pwLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {pwLoading ? t('profileChangingPw') : t('profileChangePw')}
          </button>
        </form>
      </div>

      {cropSrc && createPortal(
        <CropModal src={cropSrc} onConfirm={handleCropConfirm} onClose={() => setCropSrc(null)} shape="circle" />,
        document.body
      )}
    </div>
  )
}

export function AvatarDisplay({ user, size = 32 }: { user: { username: string; avatarColor: string; avatarImage?: string }; size?: number }) {
  if (user.avatarImage) {
    return (
      <img src={user.avatarImage} alt={user.username}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size, border: `2px solid ${user.avatarColor}` }} />
    )
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold select-none flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: user.avatarColor, fontSize: size * 0.4 }}>
      {user.username[0].toUpperCase()}
    </div>
  )
}
