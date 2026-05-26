/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

const MAX_BYTES = 5 * 1024 * 1024  // 5 MB

// POST /upload/image — multipart FormData; auth required
export async function handleUploadImage(
  request: Request,
  auth: AuthUser | null,
  env: Env,
  json: JsonFn,
  err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  let formData: FormData
  try { formData = await request.formData() } catch { return err('Invalid form data', 400) }

  const file = formData.get('file')
  if (!file || typeof file === 'string') return err('file field required', 400)

  const blob = file as File
  if (!blob.type.startsWith('image/')) return err('Only image files are allowed', 400)
  if (blob.size > MAX_BYTES) return err('File too large (max 5 MB)', 413)

  const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const key = `${auth.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  await env.IMAGES.put(key, blob.stream(), {
    httpMetadata: { contentType: blob.type },
  })

  const origin = new URL(request.url).origin
  return json({ url: `${origin}/images/${key}` })
}

// GET /images/* — serve image from R2; no auth required (public CDN-like read)
export async function handleGetImage(
  key: string,
  env: Env
): Promise<Response> {
  const object = await env.IMAGES.get(key)
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Access-Control-Allow-Origin', '*')

  return new Response(object.body, { headers })
}
