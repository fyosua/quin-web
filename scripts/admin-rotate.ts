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
    console.error('Usage: pnpm admin:rotate --username <name>')
    process.exit(1)
  }

  const user = await prisma.adminUser.findUnique({ where: { username } })
  if (!user) {
    console.error(`User "${username}" not found.`)
    process.exit(1)
  }

  const accessId = generateAccessId(24)
  const accessIdHash = await hash(accessId, { memoryCost: 19456, timeCost: 2, parallelism: 1 })

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { accessIdHash, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() },
  })
  const revoked = await prisma.session.deleteMany({ where: { userId: user.id } })

  console.log('')
  console.log('  Access ID rotated. All sessions invalidated.')
  console.log('  ------------------------------------------------------------')
  console.log(`  Username   : ${username}`)
  console.log(`  Access ID  : ${accessId}`)
  console.log(`  Sessions   : ${revoked.count} revoked`)
  console.log('  ------------------------------------------------------------')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())