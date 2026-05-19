import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import type { User } from '../types/user.types'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string } & User>('/auth/login', form)
      login(res.token, res)
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

        <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>登录 ListGo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text)', opacity: 0.6 }}>用户名</label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text)', opacity: 0.6 }}>密码</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
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
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
          没有账号？{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)' }} className="hover:opacity-70">
            注册
          </Link>
        </div>
        <div className="mt-2 text-center text-xs" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
          忘记密码？联系作者重置
        </div>
      </div>
    </div>
  )
}
