interface AvatarDisplayProps {
  user: { username: string; avatarColor: string; avatarImage?: string }
  size?: number
}

export function AvatarDisplay({ user, size = 32 }: AvatarDisplayProps) {
  if (user.avatarImage) {
    return (
      <img src={user.avatarImage} alt={user.username}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size, border: `2px solid ${user.avatarColor}` }} />
    )
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold select-none flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: user.avatarColor, fontSize: size * 0.4 }}>
      {user.username[0].toUpperCase()}
    </div>
  )
}
