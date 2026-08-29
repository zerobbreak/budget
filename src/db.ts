import '@tanstack/react-start/server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from './generated/prisma/client.js'
import { getDatabaseUrl } from './database-url.js'

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  })

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  })
}

function isFinancePrismaClient(
  client: PrismaClient,
): client is PrismaClient & {
  transaction: { findMany: (...args: unknown[]) => unknown }
} {
  return (
    'transaction' in client &&
    typeof client.transaction?.findMany === 'function'
  )
}

export function getPrisma() {
  const cached = globalForPrisma.__prisma

  if (cached && isFinancePrismaClient(cached)) {
    return cached
  }

  const client = createPrismaClient()

  if (!isFinancePrismaClient(client)) {
    throw new Error(
      'Prisma client is out of date. Run npm run db:generate, then restart the dev server.',
    )
  }

  globalForPrisma.__prisma = client
  return client
}
