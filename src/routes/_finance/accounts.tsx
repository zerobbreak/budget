import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { AccountsDashboard } from '@/components/accounts-dashboard'

const financeRoute = getRouteApi('/_finance')

export const Route = createFileRoute('/_finance/accounts')({
  component: AccountsPage,
})

function AccountsPage() {
  const { accounts } = financeRoute.useLoaderData()

  return <AccountsDashboard data={accounts} />
}
