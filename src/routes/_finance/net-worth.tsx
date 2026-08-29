import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { NetWorthDashboard } from '@/components/net-worth-dashboard'

const financeRoute = getRouteApi('/_finance')

export const Route = createFileRoute('/_finance/net-worth')({
  component: NetWorthPage,
})

function NetWorthPage() {
  const { netWorth } = financeRoute.useLoaderData()

  return <NetWorthDashboard data={netWorth} />
}
