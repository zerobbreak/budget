import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env'), quiet: true })
config({ path: resolve(process.cwd(), '.env.local'), quiet: true, override: true })

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Add it to the .env file in the project root.',
    )
  }

  return databaseUrl
}
