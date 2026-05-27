import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import DOMPurify from 'dompurify'
import { userApi } from '../../lib/api'
import { AvatarDisplay } from './AvatarDisplay'
import type { PublicProfile } from '../../types/user.types'

interface ProfileCardProps {
  username: string
  onClose: () => void
}

export function ProfileCard({ username, onClose }: ProfileCardProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi.getProfile(username)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [username])

  const goToProfile = () => { onClose(); navigate(`/u/${username}`) }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400]"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="fixed z-[401] rounded-2xl shadow-2xl p-5 w-72"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:opacity-60"
          style={{ color: 'var(--color-text)' }}
        >
          <X size={15} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : profile ? (
          <>
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              <AvatarDisplay
                user={{ username: profile.username, avatarColor: profile.avatarColor, avatarImage: profile.avatarImage }}
                size={48}
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                  {profile.displayName}
                </p>
                <p className="text-xs opacity-45 truncate" style={{ color: 'var(--color-text)' }}>
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Bio — rendered as rich HTML */}
            {profile.bio && (
              <div
                className="text-xs mb-3 leading-relaxed prose-sm max-w-none"
                style={{ color: 'var(--color-text)', opacity: 0.7 }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.bio) }}
              />
            )}

            {/* Poke message — rich HTML */}
            {profile.pokeMessage && (
              <div
                className="text-xs px-3 py-2 rounded-lg mb-3 prose-sm max-w-none"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  color: 'var(--color-primary)',
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.pokeMessage) }}
              />
            )}

            {/* Actions */}
            <button
              onClick={goToProfile}
              className="w-full text-xs py-2 rounded-lg font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              查看完整主页 →
            </button>
          </>
        ) : (
          <p className="text-xs text-center py-6" style={{ color: 'var(--color-text)', opacity: 0.4 }}>
            无法加载用户信息
          </p>
        )}
      </div>
    </>,
    document.body
  )
}
