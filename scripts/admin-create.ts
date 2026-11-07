import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const prisma = new PrismaClient()

const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateAccessId(length = 24) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

async function main() {
  const args = process.argv.slice(2)
  const username = args[args.indexOf('--username') + 1]

  if (!username || username.startsWith('--')) {
    console.error('Usage: pnpm admin:create --username <name>')
    process.exit(1)
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } })
  if (existing) {
    console.error(`User "${username}" already exists. Use admin:rotate to issue a new Access ID.`)
    process.exit(1)
  }

  const accessId = generateAccessId(24)
  const accessIdHash = await hash(accessId, { memoryCost: 19456, timeCost: 2, parallelism: 1 })

  await prisma.adminUser.create({
    data: { username, accessIdHash, passwordChangedAt: new Date() },
  })

  console.log('')
  console.log('  Admin created. Copy this Access ID now — it is shown only once.')
  console.log('  ------------------------------------------------------------')
  console.log(`  Username   : ${username}`)
  console.log(`  Access ID  : ${accessId}`)
  console.log('  ------------------------------------------------------------')
  console.log('  Store it in a password manager. Only the Argon2id hash is kept.')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())