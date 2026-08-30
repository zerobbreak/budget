import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { getDatabaseUrl } from '../src/database-url.js'

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: getDatabaseUrl(),
      connectionTimeoutMillis: 10_000,
    }),
  ),
})

async function main() {
  console.log('Clearing finance and authentication data...')

  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.stockFavorite.deleteMany(),
    prisma.appSettings.deleteMany(),
    prisma.category.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.authAccount.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.user.deleteMany(),
    prisma.benchmarkRateCache.deleteMany(),
  ])

  console.log('Cleared finance, authentication, and cached benchmark data')
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
