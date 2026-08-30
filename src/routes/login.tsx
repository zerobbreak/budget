import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthForm } from '@/components/auth-form'
import { getSession } from '@/auth.functions'

type AuthSearch = {
  redirect: string
}

function safeRedirect(value: unknown) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : '/'
}

export const Route = createFileRoute('/login')({
  validateSearch: (search): AuthSearch => ({
    redirect: safeRedirect(search.redirect),
  }),
  beforeLoad: async ({ search }) => {
    const session = await getSession()

    if (session) {
      throw redirect({ href: search.redirect })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  return <AuthForm mode="login" redirectTo={search.redirect} />
}
