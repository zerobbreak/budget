import '@tanstack/react-start/server-only'

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, '')
}

export function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim()

  if (!secret || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET is required and must be at least 32 characters. Set it in Vercel project settings.',
    )
  }

  return secret
}

export function getAuthBaseUrl() {
  const configured = process.env.BETTER_AUTH_URL?.trim()

  if (configured) {
    return normalizeOrigin(configured)
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()

  if (vercelUrl) {
    return normalizeOrigin(`https://${vercelUrl}`)
  }

  return 'http://localhost:3000'
}

export function getTrustedOrigins() {
  const origins = new Set<string>([getAuthBaseUrl()])

  for (const envVar of ['VERCEL_URL', 'VERCEL_BRANCH_URL'] as const) {
    const host = process.env[envVar]?.trim()
    if (host) {
      origins.add(normalizeOrigin(`https://${host}`))
    }
  }

  return [...origins]
}
