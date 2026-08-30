import { Line, LineChart, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/finance-data'
import type { StockPoint } from '@/lib/stocks-data'

const chartConfig: ChartConfig = {
  close: {
    label: 'Price',
    color: 'var(--chart-1)',
  },
}

function priceTooltip(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value)
  return formatCurrency(Number.isFinite(amount) ? amount : 0)
}

function formatAxisDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}

export function StockPriceChart({ series }: { series: StockPoint[] }) {
  if (series.length === 0) {
    return null
  }

  const prices = series.map((point) => point.close)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const padding = Math.max((max - min) * 0.1, 1)

  return (
    <ChartContainer config={chartConfig} className="h-[180px] w-full sm:h-[220px]">
      <LineChart data={series} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={formatAxisDate}
          className="font-hand text-[11px]"
        />
        <YAxis hide domain={[min - padding, max + padding]} />
        <ChartTooltip
          cursor={{ strokeDasharray: '4 4' }}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatAxisDate(String(value))}
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">
                  {priceTooltip(value)}
                </span>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke="var(--color-close)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
