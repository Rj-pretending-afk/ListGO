import { useState } from 'react'
import { Check, X, Plus } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { AvatarDisplay } from '../ui/AvatarDisplay'
import { useT } from '../../hooks/useLang'
import type { InviteRequestInfo } from '../../types/user.types'

interface Props {
  requests: InviteRequestInfo[]
  onRefresh: () => void
}

function RequestRow({ req, onRefresh }: { req: InviteRequestInfo; onRefresh: () => void }) {
  const t = useT()
  const [busy, setBusy] = useState<'accept' | 'reject' | 'gencode' | null>(null)
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null)

  const accept = async () => {
    setBusy('accept')
    try {
      await adminApi.acceptInviteRequest(req.id)
      setDone('accepted')
      setTimeout(() => onRefresh(), 800)
    } catch { /* ignore */ } finally { setBusy(null) }
  }

  const reject = async () => {
    setBusy('reject')
    try {
      await adminApi.rejectInviteRequest(req.id)
      setDone('rejected')
      setTimeout(() => onRefresh(), 800)
    } catch { /* ignore */ } finally { setBusy(null) }
  }

  const genCode = async () => {
    setBusy('gencode')
    try {
      await adminApi.generateUserInviteCode(req.requesterId)
      setDone('accepted')
      setTimeout(() => onRefresh(), 800)
    } catch { /* ignore */ } finally { setBusy(null) }
  }

  const rowStyle = {
    backgroundColor: 'var(--color-border)',
    opacity: done ? 0.5 : 1,
    transition: 'opacity 0.3s',
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={rowStyle}>
      <AvatarDisplay
        user={{ username: req.requesterUsername, avatarColor: req.requesterAvatarColor, avatarImage: req.requesterAvatarImage }}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate" style={{ color: 'var(--color-text)' }}>
          {req.requesterDisplayName}
        </p>
        <p className="text-xs opacity-50 truncate" style={{ color: 'var(--color-text)' }}>
          @{req.requesterUsername}
        </p>
      </div>
      {done ? (
        <span className="text-xs px-2 py-0.5 rounded" style={{ color: done === 'accepted' ? '#10B981' : '#ef4444' }}>
          {done === 'accepted' ? t('adminRequestAccepted') : t('adminRequestRejected')}
        </span>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={accept} disabled={!!busy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#10B981', color: 'white' }}>
            <Check size={12} />
            {busy === 'accept' ? t('adminAccepting') : t('adminAccept')}
          </button>
          <button onClick={reject} disabled={!!busy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
            <X size={12} />
            {busy === 'reject' ? t('adminRejecting') : t('adminReject')}
          </button>
          <button onClick={genCode} disabled={!!busy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)', opacity: 0.7 }}>
            <Plus size={12} />
            {t('adminGenCode')}
          </button>
        </div>
      )}
    </div>
  )
}

export function AdminInviteRequests({ requests, onRefresh }: Props) {
  const t = useT()

  return (
    <div className="space-y-2">
      {requests.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
          {t('adminRequestsEmpty')}
        </p>
      ) : (
        requests.map(req => (
          <RequestRow key={req.id} req={req} onRefresh={onRefresh} />
        ))
      )}
    </div>
  )
}
