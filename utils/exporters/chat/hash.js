import crypto from 'crypto'

export function hashContent (text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}
