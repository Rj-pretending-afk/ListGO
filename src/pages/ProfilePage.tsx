import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { AVATAR_COLORS } from '../lib/colors'

export default function ProfilePage() {
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

  if (!user) { navigate('/login'); return null }

  const saveName = async () => {
    if (!displayName.trim()) return
    setNameLoading(true); setNameMsg('')
    try {
      await api.put('/auth/profile', { displayName: displayName.trim() })
      updateUser({ displayName: displayName.trim() })
      setNameMsg('已保存')
      setTimeout(() => setNameMsg(''), 2000)
    } catch (e) {
      setNameMsg(e instanceof Error ? e.message : '保存失败')
    } finally { setNameLoading(false) }
  }

  const saveColor = async (color: string) => {
    try {
      await api.put('/auth/profile', { avatarColor: color })
      updateUser({ avatarColor: color })
    } catch { /* ignore */ }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwMsg('')
    if (passwords.new !== passwords.confirm) { setPwError('两次密码不一致'); return }
    if (passwords.new.length < 8) { setPwError('新密码须至少 8 字符'); return }
    setPwLoading(true)
    try {
      await api.put('/auth/password', { oldPassword: passwords.old, newPassword: passwords.new })
      setPasswords({ old: '', new: '', confirm: '' })
      setPwMsg('密码已修改')
      setTimeout(() => setPwMsg(''), 3000)
    } catch (e) {
      setPwError(e instanceof Error ? e.message : '修改失败')
    } finally { setPwLoading(false) }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const handleLogout = () => { logout(); navigate('/') }

  const sectionStyle = 'rounded-xl p-5 mb-4'
  const cardStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }
  const inputStyle = {
    backgroundColor: 'var(--color-border)',
    color: 'var(--color-text)',
    border: '1px solid transparent',
  }
  const labelStyle = { color: 'var(--color-text)', opacity: 0.6 }

  const unusedCodes = user.inviteCodes.filter(c => !c.used && !c.revoked)
  const usedCodes = user.inviteCodes.filter(c => c.used || c.revoked)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm select-none"
            style={{ backgroundColor: user.avatarColor }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{user.displayName}</p>
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>@{user.username}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm hover:opacity-70" style={{ color: '#ef4444' }}>
          退出登录
        </button>
      </div>

      {/* Display name */}
      <div className={sectionStyle} style={cardStyle}>
        <p className="text-xs font-medium mb-3" style={labelStyle}>显示昵称</p>
        <div className="flex gap-2">
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
            maxLength={40}
          />
          <button
            onClick={saveName}
            disabled={nameLoading || !displayName.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {nameLoading ? '…' : '保存'}
          </button>
        </div>
        {nameMsg && <p className="text-xs mt-2" style={{ color: 'var(--color-primary)' }}>{nameMsg}</p>}
      </div>

      {/* Avatar color */}
      <div className={sectionStyle} style={cardStyle}>
        <p className="text-xs font-medium mb-3" style={labelStyle}>头像颜色</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => saveColor(value)}
              title={label}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: value,
                outline: user.avatarColor === value ? `3px solid var(--color-text)` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Invite codes */}
      <div className={sectionStyle} style={cardStyle}>
        <p className="text-xs font-medium mb-3" style={labelStyle}>我的邀请码</p>
        {unusedCodes.length === 0 && usedCodes.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>暂无邀请码</p>
        )}
        <div className="space-y-2">
          {unusedCodes.map(c => (
            <div key={c.code} className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm tracking-wider" style={{ color: 'var(--color-text)' }}>
                {c.code}
              </span>
              <button onClick={() => copyCode(c.code)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}>
                {copiedCode === c.code ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode === c.code ? '已复制' : '复制'}
              </button>
            </div>
          ))}
          {usedCodes.map(c => (
            <div key={c.code} className="flex items-center justify-between gap-2" style={{ opacity: 0.35 }}>
              <span className="font-mono text-sm tracking-wider line-through" style={{ color: 'var(--color-text)' }}>
                {c.code}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text)' }}>
                {c.revoked ? '已撤销' : '已使用'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className={sectionStyle} style={cardStyle}>
        <p className="text-xs font-medium mb-3" style={labelStyle}>修改密码</p>
        <form onSubmit={changePassword} className="space-y-3">
          {(['old', 'new', 'confirm'] as const).map(field => (
            <input
              key={field}
              type="password"
              value={passwords[field]}
              onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
              placeholder={field === 'old' ? '当前密码' : field === 'new' ? '新密码（至少 8 字符）' : '确认新密码'}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
              autoComplete={field === 'old' ? 'current-password' : 'new-password'}
            />
          ))}
          {pwError && <p className="text-xs" style={{ color: '#ef4444' }}>{pwError}</p>}
          {pwMsg && <p className="text-xs" style={{ color: 'var(--color-primary)' }}>{pwMsg}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {pwLoading ? '修改中…' : '确认修改'}
          </button>
        </form>
      </div>
    </div>
  )
}
