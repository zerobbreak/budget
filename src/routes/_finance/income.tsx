import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { IncomeDashboard } from '@/components/income-dashboard'
import { getProjectionData } from '@/projection.functions'

const financeRoute = getRouteApi('/_finance')

export const Route = createFileRoute('/_finance/income')({
  loader: () => getProjectionData(),
  component: IncomePage,
})

function IncomePage() {
  const { income, expenses, categories } = financeRoute.useLoaderData()
  const projection = Route.useLoaderData()

  return (
    <IncomeDashboard
      data={income}
      expensesTotal={expenses.total}
      categories={categories.categories}
      projection={projection}
    />
  )
}
