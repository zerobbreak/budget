import { createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '@/auth.functions'
import { DatabaseError } from '@/components/finance/database-error'
import { FinanceShell } from '@/components/finance-shell'
import { getMonthFinance } from '@/finance.functions'
import { FINANCE_STALE_TIME_MS } from '@/lib/finance-data'

export const Route = createFileRoute('/_finance')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user: session.user }
  },
  loader: () => getMonthFinance(),
  staleTime: FINANCE_STALE_TIME_MS,
  preloadStaleTime: FINANCE_STALE_TIME_MS,
  component: FinanceShell,
  errorComponent: DatabaseError,
})
