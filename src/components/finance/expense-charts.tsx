import { Bar, BarChart, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/finance-data'
import {
  buildChartConfig,
  buildExpenseBreakdown,
  getChartColor,
  type ExpenseBreakdownItem,
} from '@/lib/finance-charts'

type ChartSource = Array<{ name: string; total: number }>

function EmptyChart({ message }: { message: string }) {
  return (
    <Card className="ring-1 ring-border/60">
      <CardContent className="px-5 py-10 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}

function TopSpenderCallout({ item, total }: { item: ExpenseBreakdownItem; total: number }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Top spender
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold tracking-tight">{item.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {item.percentage}% of {formatCurrency(total)}
        </p>
      </div>
      <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(item.value)}
      </p>
    </div>
  )
}

export function ExpenseTopSpender({
  items,
  total,
}: {
  items: ChartSource
  total?: number
}) {
  const breakdown = buildExpenseBreakdown(items)

  if (breakdown.length === 0) {
    return null
  }

  const grandTotal = total ?? breakdown.reduce((sum, item) => sum + item.value, 0)

  return <TopSpenderCallout item={breakdown[0]} total={grandTotal} />
}

function currencyTooltip(value: number | string) {
  const amount = typeof value === 'number' ? value : Number(value)
  return formatCurrency(Number.isFinite(amount) ? amount : 0)
}

export function ExpenseDonutChart({
  items,
  total,
  showTopSpender = false,
}: {
  items: ChartSource
  total?: number
  showTopSpender?: boolean
}) {
  const breakdown = buildExpenseBreakdown(items)

  if (breakdown.length === 0) {
    return <EmptyChart message="No expense data to chart this month." />
  }

  const chartConfig = buildChartConfig(breakdown)
  const grandTotal = total ?? breakdown.reduce((sum, item) => sum + item.value, 0)
  const top = breakdown[0]

  return (
    <Card className="ring-1 ring-border/60">
      <CardContent className="space-y-5 px-5 py-5">
        {showTopSpender ? <TopSpenderCallout item={top} total={grandTotal} /> : null}

        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {currencyTooltip(value)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={breakdown}
              dataKey="value"
              nameKey="name"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              strokeWidth={2}
            >
              {breakdown.map((entry, index) => (
                <Cell key={entry.name} fill={getChartColor(index)} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
                    return null
                  }

                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 8}
                        className="fill-muted-foreground text-[11px]"
                      >
                        Total
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                        className="fill-foreground text-base font-semibold"
                      >
                        {formatCurrency(grandTotal)}
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ExpenseBarChart({
  items,
  showTopSpender = false,
}: {
  items: ChartSource
  showTopSpender?: boolean
}) {
  const breakdown = buildExpenseBreakdown(items)

  if (breakdown.length === 0) {
    return <EmptyChart message="No expense data to chart this month." />
  }

  const chartConfig = buildChartConfig(breakdown)
  const chartHeight = Math.max(180, breakdown.length * 52)
  const grandTotal = breakdown.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="ring-1 ring-border/60">
      <CardContent className="space-y-4 px-5 py-5">
        {showTopSpender ? (
          <TopSpenderCallout item={breakdown[0]} total={grandTotal} />
        ) : null}

        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: chartHeight }}
        >
          <BarChart
            accessibilityLayer
            data={breakdown}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={64}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {currencyTooltip(value)} ({item.payload.percentage}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={6}>
              {breakdown.map((entry, index) => (
                <Cell key={entry.name} fill={getChartColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
