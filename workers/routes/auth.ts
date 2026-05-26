/// <reference types="@cloudflare/workers-types" />

import { hashPassword, verifyPassword } from '../lib/crypto'
import { signJWT } from '../lib/jwt'
import type { AuthUser } from '../middleware/auth'
import type { Env } from '../api'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn = (message: string, status: number) => Response

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/
const USERNAME_BLACKLIST = new Set(['admin', 'system', 'official', 'listgo', 'api'])

function nanoid(len: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  for (const b of bytes) id += chars[b % chars.length]
  return id
}

// ── POST /auth/register ──
export async function handleRegister(
  request: Request, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  let body: { username?: string; password?: string; inviteCode?: string }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const { username = '', password = '', inviteCode = '' } = body

  if (!USERNAME_RE.test(username)) return err('用户名须 3-20 字符，仅字母数字下划线', 400)
  if (USERNAME_BLACKLIST.has(username.toLowerCase())) return err('用户名不可用', 400)
  if (password.length < 8) return err('密码须至少 8 字符', 400)
  if (!inviteCode.trim()) return err('邀请码不能为空', 400)

  // Validate invite code
  const code = await env.DB.prepare(
    'SELECT * FROM invite_codes WHERE code = ? AND used_by_id IS NULL AND revoked = 0'
  ).bind(inviteCode.trim()).first<{ code: string; owner_id: string | null }>()
  if (!code) return err('邀请码无效或已使用', 400)

  // Check username uniqueness
  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (existing) return err('用户名已被使用', 409)

  const userId = nanoid(12)
  const { hash, salt } = await hashPassword(password)
  const now = Date.now()

  // Generate 1 invite code for the new user
  const newCode = nanoid(12).toUpperCase()

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO users (id, username, display_name, created_at) VALUES (?,?,?,?)'
    ).bind(userId, username, username, now),
    env.DB.prepare(
      'INSERT INTO user_credentials (user_id, password_hash, salt) VALUES (?,?,?)'
    ).bind(userId, hash, salt),
    env.DB.prepare(
      'UPDATE invite_codes SET used_by_id = ?, used_at = ? WHERE code = ?'
    ).bind(userId, now, inviteCode.trim()),
    env.DB.prepare(
      'INSERT INTO invite_codes (code, owner_id, created_at) VALUES (?,?,?)'
    ).bind(newCode, userId, now),
  ])

  const token = await signJWT({ userId, username, isAdmin: false, isSuperAdmin: false }, env.JWT_SECRET)
  return json({
    token,
    id: userId,
    username,
    displayName: username,
    avatarColor: '#10B981',
    theme: 'day',
    isAdmin: false,
    isSuperAdmin: false,
    hasRequestedInvite: false,
    inviteCodes: [{ code: newCode, used: false, usedAt: null, usedByUsername: undefined, revoked: false }],
  })
}

// ── POST /auth/login ──
export async function handleLogin(
  request: Request, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  let body: { username?: string; password?: string }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const { username = '', password = '' } = body
  if (!username || !password) return err('用户名和密码不能为空', 400)

  const user = await env.DB.prepare(
    'SELECT id, username, display_name, avatar_color, avatar_image, is_admin, theme FROM users WHERE username = ?'
  ).bind(username).first<{
    id: string; username: string; display_name: string; avatar_color: string; avatar_image: string | null; is_admin: number; theme: string | null
  }>()
  if (!user) return err('用户名或密码错误', 401)

  const creds = await env.DB.prepare(
    'SELECT password_hash, salt FROM user_credentials WHERE user_id = ?'
  ).bind(user.id).first<{ password_hash: string; salt: string }>()
  if (!creds) return err('用户名或密码错误', 401)

  const ok = await verifyPassword(password, creds.password_hash, creds.salt)
  if (!ok) return err('用户名或密码错误', 401)

  const token = await signJWT(
    { userId: user.id, username: user.username, isAdmin: user.is_admin >= 1, isSuperAdmin: user.is_admin >= 2 },
    env.JWT_SECRET
  )
  return json({
    token,
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarColor: user.avatar_color,
    avatarImage: user.avatar_image ?? undefined,
    theme: user.theme ?? 'day',
    isAdmin: user.is_admin >= 1,
    isSuperAdmin: user.is_admin >= 2,
    inviteCodes: [],
  })
}

// ── GET /auth/me ──
export async function handleMe(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const user = await env.DB.prepare(
    'SELECT id, username, display_name, avatar_color, avatar_image, theme, poke_message, bio, invite_codes_remaining, is_admin FROM users WHERE id = ?'
  ).bind(auth.userId).first<{
    id: string; username: string; display_name: string
    avatar_color: string; avatar_image: string | null; theme: string | null
    poke_message: string | null; bio: string | null; invite_codes_remaining: number; is_admin: number
  }>()
  if (!user) return err('User not found', 404)

  const [codesResult, pendingRequest] = await Promise.all([
    env.DB.prepare(`
      SELECT ic.code, ic.used_by_id, u.username AS used_by_username, ic.used_at, ic.revoked
      FROM invite_codes ic
      LEFT JOIN users u ON u.id = ic.used_by_id
      WHERE ic.owner_id = ?
    `).bind(auth.userId).all<{ code: string; used_by_id: string | null; used_by_username: string | null; used_at: number | null; revoked: number }>(),
    env.DB.prepare(
      'SELECT id FROM invite_requests WHERE requester_id = ? AND status = ? LIMIT 1'
    ).bind(auth.userId, 'pending').first(),
  ])

  // Always return a fresh token so DB role changes take effect on next page load
  const freshToken = await signJWT(
    { userId: user.id, username: user.username, isAdmin: user.is_admin >= 1, isSuperAdmin: user.is_admin >= 2 },
    env.JWT_SECRET
  )

  return json({
    token: freshToken,
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarColor: user.avatar_color,
    avatarImage: user.avatar_image ?? undefined,
    theme: user.theme ?? 'day',
    isAdmin: user.is_admin >= 1,
    isSuperAdmin: user.is_admin >= 2,
    pokeMessage: user.poke_message ?? undefined,
    bio: user.bio ?? undefined,
    hasRequestedInvite: !!pendingRequest,
    inviteCodes: (codesResult.results ?? []).map(c => ({
      code: c.code,
      used: !!c.used_by_id,
      usedAt: c.used_at,
      usedByUsername: c.used_by_username ?? undefined,
      revoked: Boolean(c.revoked),
    })),
  })
}

// ── PUT /auth/profile ──
export async function handleUpdateProfile(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  let body: { displayName?: string; avatarColor?: string; avatarImage?: string | null; theme?: string; pokeMessage?: string | null; bio?: string | null }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const updates: string[] = []
  const values: unknown[] = []

  if (body.displayName !== undefined) {
    const name = String(body.displayName).trim()
    if (!name || name.length > 40) return err('昵称须 1-40 字符', 400)
    updates.push('display_name = ?')
    values.push(name)
  }
  if (body.avatarColor !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(body.avatarColor)) return err('颜色格式无效', 400)
    updates.push('avatar_color = ?')
    values.push(body.avatarColor)
  }
  if ('avatarImage' in body) {
    if (body.avatarImage !== null && body.avatarImage !== undefined &&
        !String(body.avatarImage).startsWith('data:image')) {
      return err('无效的图片格式', 400)
    }
    updates.push('avatar_image = ?')
    values.push(body.avatarImage ?? null)
  }
  if (body.theme !== undefined) {
    const VALID_THEMES = ['clay-light','clay-dark','glass-light','glass-dark','minimal-light','minimal-dark','brutal-light','brutal-dark','material-light','material-dark','bauhaus-light','bauhaus-dark','retro-light','retro-dark']
    if (!VALID_THEMES.includes(body.theme)) return err('无效主题', 400)
    updates.push('theme = ?')
    values.push(body.theme)
  }
  if ('bio' in body) {
    const b = body.bio ? String(body.bio).trim() : null
    if (b && b.length > 120) return err('简介须 120 字以内', 400)
    updates.push('bio = ?')
    values.push(b || null)
  }
  if ('pokeMessage' in body) {
    if (body.pokeMessage !== null && body.pokeMessage !== undefined) {
      const msg = String(body.pokeMessage).trim()
      if (msg.length > 50) return err('被戳提示须 50 字以内', 400)
      updates.push('poke_message = ?')
      values.push(msg || null)
    } else {
      updates.push('poke_message = ?')
      values.push(null)
    }
  }
  if (updates.length === 0) return err('无可更新字段', 400)

  values.push(auth.userId)
  await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  return json({ ok: true })
}

// ── PUT /auth/password ──
export async function handleChangePassword(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  let body: { oldPassword?: string; newPassword?: string }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const { oldPassword = '', newPassword = '' } = body
  if (!oldPassword || !newPassword) return err('旧密码和新密码不能为空', 400)
  if (newPassword.length < 8) return err('新密码须至少 8 字符', 400)

  const creds = await env.DB.prepare(
    'SELECT password_hash, salt FROM user_credentials WHERE user_id = ?'
  ).bind(auth.userId).first<{ password_hash: string; salt: string }>()
  if (!creds) return err('用户不存在', 404)

  const ok = await verifyPassword(oldPassword, creds.password_hash, creds.salt)
  if (!ok) return err('旧密码错误', 401)

  const { hash, salt } = await hashPassword(newPassword)
  await env.DB.prepare(
    'UPDATE user_credentials SET password_hash = ?, salt = ? WHERE user_id = ?'
  ).bind(hash, salt, auth.userId).run()

  return json({ ok: true })
}

// ── GET /users/:username/profile ── public profile
export async function handleGetUserProfile(
  username: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const row = await env.DB.prepare(
    'SELECT id, username, display_name, avatar_color, avatar_image, bio, poke_message FROM users WHERE username = ?'
  ).bind(username).first<{
    id: string; username: string; display_name: string
    avatar_color: string; avatar_image: string | null
    bio: string | null; poke_message: string | null
  }>()
  if (!row) return err('用户不存在', 404)

  return json({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    avatarImage: row.avatar_image ?? undefined,
    bio: row.bio ?? undefined,
    pokeMessage: row.poke_message ?? undefined,
    isSelf: auth?.userId === row.id,
  })
}

// ── GET /users/search?q= ──
export async function handleSearchUsers(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn
): Promise<Response> {
  if (!auth) return json([])
  const q = new URL(request.url).searchParams.get('q') ?? ''
  if (q.length < 1) return json([])
  const rows = await env.DB.prepare(
    'SELECT username, display_name FROM users WHERE username LIKE ? AND id != ? LIMIT 8'
  ).bind(`${q}%`, auth.userId).all<{ username: string; display_name: string | null }>()
  return json((rows.results ?? []).map(r => ({ username: r.username, displayName: r.display_name ?? r.username })))
}

