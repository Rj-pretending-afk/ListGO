import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🤔</p>
      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        页面不存在
      </p>
      <Link
        to="/"
        className="text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-primary)' }}
      >
        回到首页
      </Link>
    </div>
  )
}
