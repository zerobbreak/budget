import '@tanstack/react-start/server-only'

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { getPrisma } from '@/db'

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  account: {
    modelName: 'AuthAccount',
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [tanstackStartCookies()],
})
