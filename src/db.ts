import '@tanstack/react-start/server-only'
import { attachDatabasePool } from '@vercel/functions'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from './generated/prisma/client.js'
import { getDatabaseUrl } from './database-url.js'

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient
  __pgPool?: Pool
}

function createPgPool() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  })

  if (process.env.VERCEL) {
    attachDatabasePool(pool)
  }

  return pool
}

function createPrismaClient() {
  const pool = globalForPrisma.__pgPool ?? createPgPool()
  globalForPrisma.__pgPool = pool

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  })
}

export function getPrisma() {
  const cached = globalForPrisma.__prisma

  if (cached) {
    return cached
  }

  const client = createPrismaClient()
  globalForPrisma.__prisma = client
  return client
}
