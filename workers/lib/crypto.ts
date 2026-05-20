export async function hashPassword(password: string, existingSalt?: string) {
  const saltBytes = existingSalt
    ? Uint8Array.from(atob(existingSalt), c => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial, 256
  )

  return {
    hash: btoa(String.fromCharCode(...new Uint8Array(hashBuffer))),
    salt: btoa(String.fromCharCode(...saltBytes)),
  }
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const result = await hashPassword(password, salt)
  return result.hash === hash
}
