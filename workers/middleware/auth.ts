import { verifyJWT, type JWTPayload } from '../lib/jwt'

export type AuthUser = JWTPayload

export async function getAuth(request: Request, jwtSecret: string): Promise<AuthUser | null> {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return verifyJWT(header.slice(7), jwtSecret)
}
