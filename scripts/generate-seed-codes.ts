/**
 * 冷启动：向 D1 插入种子邀请码
 * 用法：npx tsx scripts/generate-seed-codes.ts <数量>
 *
 * 生成的 SQL 语句直接打印，手动执行或通过 wrangler 导入：
 *   npx tsx scripts/generate-seed-codes.ts 20 | npx wrangler d1 execute listgo --command
 */

const count = parseInt(process.argv[2] ?? '20', 10)
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genCode(): string {
  let code = ''
  const bytes = new Uint8Array(12)
  // Node.js 19+: crypto.getRandomValues works; fallback to require('crypto')
  try {
    const { randomFillSync } = await import('crypto' as string) as typeof import('crypto')
    randomFillSync(bytes)
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  for (const b of bytes) code += chars[b % chars.length]
  return code
}

const now = Date.now()
const codes: string[] = []
for (let i = 0; i < count; i++) {
  let code: string
  do { code = genCode() } while (codes.includes(code))
  codes.push(code)
}

console.log('-- Seed invite codes')
for (const code of codes) {
  console.log(`INSERT INTO invite_codes (code, owner_id, created_at) VALUES ('${code}', NULL, ${now});`)
}
console.log(`-- Done: ${count} codes generated`)
