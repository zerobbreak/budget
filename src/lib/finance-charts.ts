export type ExpenseBreakdownItem = {
  name: string
  value: number
  percentage: number
}

export function aggregateByCategory(
  items: Array<{ name: string; total: number }>,
): Array<{ name: string; total: number }> {
  return items.filter((item) => item.total > 0)
}

export function aggregateTransactionsByCategory(
  transactions: Array<{ category: string; amount: number }>,
): Array<{ name: string; total: number }> {
  const totals = new Map<string, number>()

  for (const transaction of transactions) {
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + transaction.amount,
    )
  }

  return [...totals.entries()].map(([name, total]) => ({ name, total }))
}

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function buildExpenseBreakdown(
  items: Array<{ name: string; total: number }>,
): ExpenseBreakdownItem[] {
  const sorted = [...items]
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)

  const grandTotal = sorted.reduce((sum, item) => sum + item.total, 0)

  if (grandTotal === 0) {
    return []
  }

  return sorted.map((item) => ({
    name: item.name,
    value: item.total,
    percentage: Math.round((item.total / grandTotal) * 100),
  }))
}

export function getChartColor(index: number) {
  return chartColors[index % chartColors.length]
}

export function buildChartConfig(
  items: ExpenseBreakdownItem[],
): Record<string, { label: string; color: string }> {
  return items.reduce<Record<string, { label: string; color: string }>>(
    (config, item, index) => {
      config[item.name] = {
        label: item.name,
        color: getChartColor(index),
      }
      return config
    },
    {},
  )
}
