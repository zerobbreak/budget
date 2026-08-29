import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { ExpensesDashboard } from '@/components/expenses-dashboard'

const financeRoute = getRouteApi('/_finance')

export const Route = createFileRoute('/_finance/expenses')({
  component: ExpensesPage,
})

function ExpensesPage() {
  const { expenses } = financeRoute.useLoaderData()

  return <ExpensesDashboard data={expenses} />
}
