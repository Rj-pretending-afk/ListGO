import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { useAppStore } from './lib/store'
import { useAuthStore } from './hooks/useAuth'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import Home from './pages/Home'
import ListPage from './pages/ListPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import AdminListPage from './pages/AdminListPage'
import UserProfilePage from './pages/UserProfilePage'
import FriendsPage from './pages/FriendsPage'
import NotFound from './pages/NotFound'

export default function App() {
  const init = useAppStore(s => s.init)
  const initAuth = useAuthStore(s => s.initAuth)
  const online = useNetworkStatus()

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
        {!online && (
          <div
            className="fixed bottom-0 inset-x-0 z-[500] py-2 px-4 text-xs text-center font-medium"
            style={{ backgroundColor: '#1f2937', color: '#f9fafb' }}
          >
            📶 网络已断开，编辑内容已保存在本地
          </div>
        )}
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
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
