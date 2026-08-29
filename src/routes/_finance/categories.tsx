import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { CategoriesDashboard } from '@/components/categories-dashboard'

const financeRoute = getRouteApi('/_finance')

export const Route = createFileRoute('/_finance/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { categories } = financeRoute.useLoaderData()

  return <CategoriesDashboard data={categories} />
}
