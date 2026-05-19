/**
 * 冷启动：向 D1 插入种子邀请码
 * 用法：npx tsx scripts/generate-seed-codes.ts <数量>
 *
 * 把生成的 INSERT 语句逐条通过 wrangler 执行：
 *   npx tsx scripts/generate-seed-codes.ts 5
 *   然后复制每条 INSERT 单独执行：
 *   npx wrangler d1 execute listgo --command="INSERT INTO invite_codes ..."
 */

import { randomFillSync } from 'crypto'

const count = parseInt(process.argv[2] ?? '10', 10)
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genCode(): string {
  const bytes = new Uint8Array(12)
  randomFillSync(bytes)
  let code = ''
  for (const b of bytes) code += chars[b % chars.length]
  return code
}

const now = Date.now()
const codes: string[] = []
while (codes.length < count) {
  const code = genCode()
  if (!codes.includes(code)) codes.push(code)
}

console.log('-- 复制下方每条 INSERT，逐条执行：')
console.log('-- npx wrangler d1 execute listgo --command="<INSERT 语句>"')
console.log('')
for (const code of codes) {
  console.log(`INSERT INTO invite_codes (code, owner_id, created_at) VALUES ('${code}', NULL, ${now});`)
}
