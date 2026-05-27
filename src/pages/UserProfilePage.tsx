import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import DOMPurify from 'dompurify'
import { userApi, pokeApi } from '../lib/api'
import { useAuthStore } from '../hooks/useAuth'
import { AvatarDisplay } from '../components/ui/AvatarDisplay'
import { useT } from '../hooks/useLang'
import type { PublicProfile } from '../types/user.types'

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const t = useT()
  const currentUser = useAuthStore(s => s.user)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [pokeState, setPokeState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (!username) return
    setProfile(null)
    setNotFound(false)
    userApi.getProfile(username)
      .then(setProfile)
      .catch(() => setNotFound(true))
  }, [username])

  const handlePoke = async () => {
    if (!profile || !currentUser || pokeState !== 'idle') return
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

  if (notFound) {
    return (
      <div className="text-center py-24 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        用户不存在
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-24 text-sm" style={{ color: 'var(--color-text)', opacity: 0.35 }}>
        {t('loading')}
      </div>
    )
  }

  const canPoke = !!currentUser && !profile.isSelf

  const pokeButtonLabel =
    pokeState === 'sending' ? '…'
    : pokeState === 'sent'  ? t('userPokeSent')
    : pokeState === 'error' ? t('userPokeError')
    : t('userPokeBtn')

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="text-xs mb-8 hover:opacity-60 transition-opacity"
        style={{ color: 'var(--color-text)', opacity: 0.4 }}
      >
        ← 返回
      </button>

      {/* Avatar + identity */}
      <div className="flex items-center gap-5 mb-6">
        <AvatarDisplay user={profile} size={72} border />
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--color-text)' }}>
            {profile.displayName}
          </h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: 'var(--color-text)', opacity: 0.45 }}>
            @{profile.username}
          </p>
          {profile.isSelf && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}>
              {t('userIsSelf')}
            </p>
          )}
        </div>
      </div>

      {/* Bio — rendered as rich HTML */}
      {profile.bio && (
        <div
          className="text-sm mb-6 leading-relaxed prose-sm max-w-none"
          style={{ color: 'var(--color-text)', opacity: 0.75 }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.bio) }}
        />
      )}

      {/* Poke message (被戳提示) — rich HTML display */}
      {canPoke && profile.pokeMessage && (
        <div
          className="text-sm mb-4 px-4 py-3 rounded-xl leading-relaxed prose-sm max-w-none"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            color: 'var(--color-primary)',
          }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.pokeMessage) }}
        />
      )}

      {/* Poke button */}
      {canPoke && (
        <button
          onClick={() => void handlePoke()}
          disabled={pokeState === 'sending'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Zap size={15} />
          {pokeButtonLabel}
        </button>
      )}

      {/* Go to own profile */}
      {profile.isSelf && (
        <button
          onClick={() => navigate('/profile')}
          className="text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-primary)' }}
        >
          编辑个人资料 →
        </button>
      )}
    </div>
  )
}
