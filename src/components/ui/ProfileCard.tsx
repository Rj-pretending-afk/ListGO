import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Zap, Pencil, UserPlus, UserCheck, UserX, Clock } from 'lucide-react'
import DOMPurify from 'dompurify'
import { userApi, pokeApi, friendApi } from '../../lib/api'
import { AvatarDisplay } from './AvatarDisplay'
import { useAuthStore } from '../../hooks/useAuth'
import { useT } from '../../hooks/useLang'
import type { PublicProfile, FriendshipStatus } from '../../types/user.types'

interface ProfileCardProps {
  username: string
  onClose: () => void
  isPokeBack?: boolean
}

export function ProfileCard({ username, onClose, isPokeBack = false }: ProfileCardProps) {
  const t = useT()
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pokeState, setPokeState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none')
  const [friendshipId, setFriendshipId] = useState<string | undefined>()
  const [friendAction, setFriendAction] = useState<'idle' | 'loading'>('idle')

  useEffect(() => {
    userApi.getProfile(username)
      .then(p => {
        setProfile(p)
        setFriendStatus(p.friendshipStatus ?? 'none')
        setFriendshipId(p.friendshipId)
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [username])

  const handlePoke = async () => {
    if (!profile || pokeState !== 'idle') return
    setPokeState('sending')
    try {
      await pokeApi.send(profile.id)
      setPokeState('sent')
      setTimeout(() => setPokeState('idle'), 2000)
    } catch {
      setPokeState('error')
      setTimeout(() => setPokeState('idle'), 2000)
    }
  }

  const handleFriendAction = async () => {
    if (!profile || friendAction === 'loading') return
    setFriendAction('loading')
    try {
      if (friendStatus === 'none') {
        await friendApi.sendRequest(profile.id)
        setFriendStatus('pending_sent')
      } else if (friendStatus === 'pending_received' && friendshipId) {
        await friendApi.accept(friendshipId)
        setFriendStatus('accepted')
      } else if (friendStatus === 'accepted' && friendshipId) {
        await friendApi.remove(friendshipId)
        setFriendStatus('none')
        setFriendshipId(undefined)
      }
    } catch { /* silent */ }
    finally { setFriendAction('idle') }
  }

  const goToEdit = () => { onClose(); navigate('/profile') }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[400]"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        onClick={onClose}
      />

      <div
        className="fixed z-[401] rounded-2xl shadow-2xl flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '22rem',
          maxHeight: '85vh',
          backgroundColor: 'var(--color-modal-bg, var(--color-card))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:opacity-60 z-10"
          style={{ color: 'var(--color-text)' }}
        >
          <X size={15} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : profile ? (
          <>
            {/* Header band */}
            <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-4">
                <AvatarDisplay
                  user={{ username: profile.username, avatarColor: profile.avatarColor, avatarImage: profile.avatarImage }}
                  size={64}
                  border
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base truncate" style={{ color: 'var(--color-text)' }}>
                    {profile.displayName}
                  </p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
                    @{profile.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {profile.bio ? (
                <div
                  className="text-sm leading-relaxed prose-sm max-w-none"
                  style={{ color: 'var(--color-text)', opacity: 0.8 }}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.bio) }}
                />
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--color-text)', opacity: 0.3 }}>
                  {t('profileNoBio')}
                </p>
              )}
            </div>

            {/* Actions footer */}
            <div
              className="px-5 py-3 flex gap-2 flex-wrap"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              {profile.isSelf ? (
                <button
                  onClick={goToEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <Pencil size={12} />
                  {t('profileEditProfile')}
                </button>
              ) : currentUser ? (
                <>
                  {/* Friend action */}
                  {friendStatus === 'none' && (
                    <button
                      onClick={() => void handleFriendAction()}
                      disabled={friendAction === 'loading'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      <UserPlus size={12} />
                      {t('friendAdd')}
                    </button>
                  )}
                  {friendStatus === 'pending_sent' && (
                    <span
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)', opacity: 0.5 }}
                    >
                      <Clock size={12} />
                      {t('friendPending')}
                    </span>
                  )}
                  {friendStatus === 'pending_received' && (
                    <button
                      onClick={() => void handleFriendAction()}
                      disabled={friendAction === 'loading'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      <UserCheck size={12} />
                      {t('friendPendingReceived')}
                    </button>
                  )}
                  {friendStatus === 'accepted' && (
                    <button
                      onClick={() => void handleFriendAction()}
                      disabled={friendAction === 'loading'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      <UserX size={12} />
                      {t('friendRemove')}
                    </button>
                  )}
                  {/* Poke */}
                  <button
                    onClick={() => void handlePoke()}
                    disabled={pokeState === 'sending'}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    <Zap size={12} />
                    {pokeState === 'sent' ? t('userPokeSent') : pokeState === 'error' ? t('userPokeError') : isPokeBack ? t('pokeBack') : t('userPokeBtn')}
                  </button>
                </>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
              {t('profileLoadFailed')}
            </p>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
