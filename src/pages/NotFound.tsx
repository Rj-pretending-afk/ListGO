import { Link } from 'react-router-dom'
import { useT } from '../hooks/useLang'

export default function NotFound() {
  const t = useT()
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🤔</p>
      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{t('notFound')}</p>
      <Link to="/" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-primary)' }}>
        {t('backHome')}
      </Link>
    </div>
  )
}
