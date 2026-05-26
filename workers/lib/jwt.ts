export interface JWTPayload {
  userId: string
  username: string
  isAdmin: boolean
  isSuperAdmin: boolean
  exp?: number
}

const b64url = {
  encode: (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'),
  decode: (s: string) =>
    JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/'))),
}

export async function signJWT(payload: Omit<JWTPayload, 'exp'>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 3600
  const data = `${b64url.encode(header)}.${b64url.encode({ ...payload, exp })}`

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${data}.${sigStr}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sigB64] = parts
    const data = `${headerB64}.${payloadB64}`

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data))
    if (!valid) return null

    const payload = b64url.decode(payloadB64) as JWTPayload
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null

    // Backcompat: old tokens without isSuperAdmin
    if (payload.isSuperAdmin === undefined) payload.isSuperAdmin = false

    return payload
  } catch {
    return null
  }
}
