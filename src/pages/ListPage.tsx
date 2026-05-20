import { useParams } from 'react-router-dom'
import { ListView } from '../components/List/ListView'
import { useListById } from '../hooks/useList'

export default function ListPage() {
  const { id } = useParams<{ id: string }>()
  const list = useListById(id ?? '')

  if (!id || !list) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        清单不存在或已删除
      </div>
    )
  }

  return <ListView list={list} />
}
