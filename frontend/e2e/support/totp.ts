import { createHmac } from 'node:crypto'

/** RFC 6238 TOTP — what an authenticator app computes from the setup key. */
export function totp(secret: string, stepOffset = 0): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = secret.replace(/\s/g, '').toUpperCase().split('')
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, '0')).join('')
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + stepOffset))
  const hash = createHmac('sha1', key).update(counter).digest()
  const offset = hash[hash.length - 1]! & 0x0f
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}
