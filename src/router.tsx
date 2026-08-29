import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { FINANCE_STALE_TIME_MS } from './lib/finance-data'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: FINANCE_STALE_TIME_MS,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
