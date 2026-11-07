import { hash, verify } from '@node-rs/argon2'

// PRD §7: Argon2id, m=19 MiB, t=2, p=1
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export async function hashSecret(plain: string): Promise<string> {
  return hash(plain, OPTIONS)
}

export async function verifySecret(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain, OPTIONS)
  } catch {
    return false
  }
}

// Used to keep timing uniform when the username does not exist (PRD §7: user enumeration).
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$Xb0h4uJ9B8i1o0m0H1aXQ7dQm8y6Jm2nB2r4mZ0kY7E'

export async function burnTime(plain: string): Promise<void> {
  try {
    await verify(DUMMY_HASH, plain, OPTIONS)
  } catch {
    /* ignore */
  }
}

export function generateAccessId(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}

export function passwordPolicyError(password: string, username: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 128) return 'Password must be at most 128 characters.'
  if (password.toLowerCase() === username.toLowerCase()) return 'Password must differ from the username.'
  const common = new Set([
    'password1234',
    'qwertyuiop12',
    '123456789012',
    'letmein123456',
    'administrator1',
    'passwordpassword',
  ])
  if (common.has(password.toLowerCase())) return 'That password is too common.'
  return null
}