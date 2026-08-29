import { createFileRoute } from '@tanstack/react-router'

import { StocksDashboard } from '@/components/stocks-dashboard'
import { getStocksPageData } from '@/stocks.functions'

export const Route = createFileRoute('/_finance/stocks')({
  loader: () => getStocksPageData(),
  component: StocksPage,
})

function StocksPage() {
  const data = Route.useLoaderData()

  return <StocksDashboard data={data} />
}
