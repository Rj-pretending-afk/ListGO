import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import type { User } from '../types/user.types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [form, setForm] = useState({ username: '', password: '', inviteCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string } & User>('/auth/register', form)
      login(res.token, res)
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>加入 ListGo</h1>
        <p className="text-xs mb-6" style={{ color: 'var(--color-text)', opacity: 0.4 }}>需要邀请码，联系作者获取</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text)', opacity: 0.6 }}>用户名</label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              placeholder="3-20 字符，字母数字下划线"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }}
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
              ⚠ 用户名一旦确定不可修改
            </p>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text)', opacity: 0.6 }}>密码</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
              placeholder="至少 8 字符"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text)', opacity: 0.6 }}>邀请码</label>
            <input
              value={form.inviteCode}
              onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
              placeholder="12 位大写码"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono tracking-widest"
              style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }}
              required
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {loading ? '注册中…' : '注册'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
          已有账号？{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)' }} className="hover:opacity-70">
            登录
          </Link>
        </div>
      </div>
    </div>
  )
}
