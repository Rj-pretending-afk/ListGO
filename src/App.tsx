import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { useAppStore } from './lib/store'
import { useAuthStore } from './hooks/useAuth'
import Home from './pages/Home'
import ListPage from './pages/ListPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import AdminListPage from './pages/AdminListPage'
import UserProfilePage from './pages/UserProfilePage'
import NotFound from './pages/NotFound'

export default function App() {
  const init = useAppStore(s => s.init)
  const initAuth = useAuthStore(s => s.initAuth)

  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      await init()
      if (!cancelled) await initAuth()
    }
    void bootstrap()
    return () => { cancelled = true }
  }, [init, initAuth])

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list/:id" element={<ListPage />} />
            <Route path="/l/:id" element={<ListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/list/:id" element={<AdminListPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
