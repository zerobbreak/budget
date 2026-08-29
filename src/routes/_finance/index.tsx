import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { OverviewDashboard } from '@/components/overview-dashboard'

const financeRoute = getRouteApi('/_finance')

export const Route = createFileRoute('/_finance/')({
  component: OverviewPage,
})

function OverviewPage() {
  const { overview, netWorth } = financeRoute.useLoaderData()

  return <OverviewDashboard data={overview} totalBalance={netWorth.total} />
}
