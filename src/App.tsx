import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { useAppStore } from './lib/store'
import Home from './pages/Home'
import ListPage from './pages/ListPage'
import NotFound from './pages/NotFound'

export default function App() {
  const init = useAppStore(s => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list/:id" element={<ListPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
