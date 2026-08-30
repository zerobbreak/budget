import { useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { ArrowDown, ArrowUp, Star } from 'lucide-react'

import {
  FinancePage,
  PageHeader,
  SectionLabel,
} from '@/components/finance/page-shell'
import { Field } from '@/components/finance/form-field'
import { StockPriceChart } from '@/components/finance/stock-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useFinanceAction } from '@/hooks/use-finance-action'
import { formatCurrency } from '@/lib/finance-data'
import { cn } from '@/lib/utils'
import {
  setStockSavingsGoal,
  toggleFavoriteStock,
  type FavoriteStock,
  type StocksPageData,
} from '@/stocks.functions'

function WatchlistItem({
  stock,
  tilt,
}: {
  stock: StocksPageData['curated'][number]
  tilt: 'a' | 'b'
}) {
  const { run, pending, error } = useFinanceAction()
  const toggleFavoriteFn = useServerFn(toggleFavoriteStock)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        run(() => toggleFavoriteFn({ data: { symbol: stock.symbol } }))
      }
      title={error ?? undefined}
      className={cn(
        'sketch-panel flex items-center justify-between gap-3 bg-card px-4 py-3 text-left transition-transform disabled:opacity-60',
        tilt === 'a' ? 'sketch-tilt-a' : 'sketch-tilt-b',
      )}
    >
      <span>
        <span className="block font-hand text-sm font-semibold">
          {stock.symbol}
        </span>
        <span className="block text-xs text-muted-foreground">
          {stock.name}
        </span>
      </span>
      <Star
        className={cn(
          'sketch-icon size-4 shrink-0',
          stock.favorited
            ? 'fill-primary text-primary'
            : 'text-muted-foreground',
        )}
      />
    </button>
  )
}

function QuoteChange({ change, changePercent }: { change: number; changePercent: number }) {
  const isUp = change >= 0
  const Icon = isUp ? ArrowUp : ArrowDown

  return (
    <span className="flex items-center gap-1 text-sm font-medium text-foreground tabular-nums">
      <Icon className="sketch-icon size-3.5" />
      {formatCurrency(Math.abs(change))} ({Math.abs(changePercent)}%)
    </span>
  )
}

function GoalForm({ stock }: { stock: FavoriteStock }) {
  const { run, pending, error } = useFinanceAction()
  const setGoalFn = useServerFn(setStockSavingsGoal)
  const [targetShares, setTargetShares] = useState(
    stock.goal ? String(stock.goal.targetShares) : '10',
  )
  const [targetDate, setTargetDate] = useState(stock.goal?.targetDate ?? '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    try {
      await run(() =>
        setGoalFn({
          data: {
            symbol: stock.symbol,
            targetShares: Number(targetShares),
            targetDate,
          },
        }),
      )
    } catch {
      // Error is shown below the form.
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <Field label="Target shares">
        <Input
          type="number"
          min={1}
          step={1}
          required
          value={targetShares}
          onChange={(event) => setTargetShares(event.target.value)}
        />
      </Field>
      <Field label="Target date">
        <Input
          type="date"
          required
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? 'Calculating…' : 'Calculate savings'}
      </Button>
      {error ? (
        <p className="text-sm text-destructive sm:col-span-3" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function SavingsCallout({ stock }: { stock: FavoriteStock }) {
  const plan = stock.savingsPlan

  if (!plan) {
    return (
      <p className="text-sm text-muted-foreground">
        Set a target number of shares and a date to see what you'd need to
        save each month.
      </p>
    )
  }

  return (
    <div className="sketch-panel bg-primary/10 px-4 py-3">
      <p className="font-hand text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
        To reach the goal
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(plan.monthlySavings)}
        <span className="text-sm font-normal text-muted-foreground"> / month</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        For {plan.monthsRemaining} {plan.monthsRemaining === 1 ? 'month' : 'months'}{' '}
        to afford {plan.targetShares}{' '}
        {plan.targetShares === 1 ? 'share' : 'shares'} (
        {formatCurrency(plan.targetCost)} total) by{' '}
        {new Date(`${plan.targetDate}T12:00:00`).toLocaleDateString('en-ZA', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        .
      </p>
    </div>
  )
}

function FavoriteStockSection({ stock }: { stock: FavoriteStock }) {
  const { run, pending } = useFinanceAction()
  const toggleFavoriteFn = useServerFn(toggleFavoriteStock)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-hand text-xl font-medium">
            {stock.name}{' '}
            <span className="text-muted-foreground">({stock.symbol})</span>
          </h2>
          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-lg font-semibold tabular-nums">
              {formatCurrency(stock.quote.price)}
            </span>
            <QuoteChange
              change={stock.quote.change}
              changePercent={stock.quote.changePercent}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() =>
            run(() => toggleFavoriteFn({ data: { symbol: stock.symbol } }))
          }
        >
          <Star className="sketch-icon size-3.5 fill-primary text-primary" />
          Unfavorite
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-5 px-5 py-5">
          <StockPriceChart series={stock.series} />
          <GoalForm stock={stock} />
          <SavingsCallout stock={stock} />
        </CardContent>
      </Card>
    </section>
  )
}

export function StocksDashboard({ data }: { data: StocksPageData }) {
  return (
    <FinancePage>
      <PageHeader
        title="Stocks"
        subtitle={
          data.usingLiveData
            ? 'Live prices via Alpha Vantage'
            : 'Simulated prices — add ALPHA_VANTAGE_API_KEY for live data'
        }
      />

      <section className="space-y-3">
        <SectionLabel>Watchlist</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {data.curated.map((stock, index) => (
            <WatchlistItem
              key={stock.symbol}
              stock={stock}
              tilt={index % 2 === 0 ? 'a' : 'b'}
            />
          ))}
        </div>
      </section>

      {data.favorites.length === 0 ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Star a stock above to track its price and plan how much to save
            toward it.
          </CardContent>
        </Card>
      ) : (
        data.favorites.map((stock) => (
          <FavoriteStockSection key={stock.symbol} stock={stock} />
        ))
      )}
    </FinancePage>
  )
}
