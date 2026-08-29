import { createFileRoute } from '@tanstack/react-router'

import { DatabaseError } from '@/components/finance/database-error'
import { FinanceShell } from '@/components/finance-shell'
import { getMonthFinance } from '@/finance.functions'
import { FINANCE_STALE_TIME_MS } from '@/lib/finance-data'

export const Route = createFileRoute('/_finance')({
  loader: () => getMonthFinance(),
  staleTime: FINANCE_STALE_TIME_MS,
  preloadStaleTime: FINANCE_STALE_TIME_MS,
  component: FinanceShell,
  errorComponent: DatabaseError,
})
