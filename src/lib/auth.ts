import '@tanstack/react-start/server-only'

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { getPrisma } from '@/db'
import {
  getAuthBaseUrl,
  getAuthSecret,
  getTrustedOrigins,
} from '@/lib/auth-env'

export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthBaseUrl(),
  trustedOrigins: getTrustedOrigins(),
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
