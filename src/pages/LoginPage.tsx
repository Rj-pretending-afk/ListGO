import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { useAppStore } from '../lib/store'
import { useT } from '../hooks/useLang'
import type { User } from '../types/user.types'

const LAST_USER_KEY = 'listgo_last_username'

export default function LoginPage() {
  const t = useT()
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const initApp = useAppStore(s => s.init)
  const [form, setForm] = useState({
    username: localStorage.getItem(LAST_USER_KEY) ?? '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post<{ token: string } & User>('/auth/login', form)
      localStorage.setItem(LAST_USER_KEY, form.username)
      login(res.token, res)
      // Reload lists from DB so the new user's filtered view is fresh
      await initApp()
      navigate('/')
    } catch (e) { setError(e instanceof Error ? e.message : t('loginSubmit')) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>{t('loginTitle')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(['username', 'password'] as const).map(field => (
            <div key={field}>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                {t(field === 'username' ? 'loginUsername' : 'loginPassword')}
              </label>
              <input type={field === 'password' ? 'password' : 'text'}
                value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                autoComplete={field === 'password' ? 'current-password' : 'username'}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', border: '1px solid transparent' }}
                required />
            </div>
          ))}
          {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {loading ? t('loginLoading') : t('loginSubmit')}
          </button>
        </form>
        <div className="mt-5 text-center text-sm" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
          {t('loginNoAccount')}{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)' }} className="hover:opacity-70">{t('loginGoRegister')}</Link>
        </div>
        <div className="mt-2 text-center text-xs" style={{ color: 'var(--color-text)', opacity: 0.35 }}>{t('loginForgot')}</div>
      </div>
    </div>
  )
}
