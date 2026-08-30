import { useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Settings2 } from 'lucide-react'

import { Field, NativeSelect } from '@/components/finance/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useFinanceAction } from '@/hooks/use-finance-action'
import { formatCurrency } from '@/lib/finance-data'
import { BENCHMARK_OPTIONS } from '@/lib/projection-data'
import { updateAppSettings } from '@/projection.functions'
import type { ProjectionData } from '@/projection.types'

function SettingsForm({
  data,
  onDone,
}: {
  data: ProjectionData
  onDone: () => void
}) {
  const { run, pending, error } = useFinanceAction()
  const updateFn = useServerFn(updateAppSettings)
  const [benchmarkSymbol, setBenchmarkSymbol] = useState(
    data.settings.benchmarkSymbol,
  )
  const [savingsRate, setSavingsRate] = useState(
    String(data.settings.savingsRate),
  )
  const [refreshHours, setRefreshHours] = useState(
    String(data.settings.refreshHours),
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    try {
      await run(() =>
        updateFn({
          data: {
            benchmarkSymbol,
            savingsRate: Number(savingsRate),
            refreshHours: Number(refreshHours),
          },
        }),
      )
      onDone()
    } catch {
      // Error is shown below the form.
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 sm:grid-cols-3 sm:items-end"
    >
      <Field label="Investment benchmark">
        <NativeSelect
          value={benchmarkSymbol}
          onChange={(event) => setBenchmarkSymbol(event.target.value)}
        >
          {BENCHMARK_OPTIONS.map((option) => (
            <option key={option.symbol} value={option.symbol}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Savings account rate (% / yr)" hint="Manual fallback rate">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          required
          value={savingsRate}
          onChange={(event) => setSavingsRate(event.target.value)}
        />
      </Field>
      <Field label="Refresh interval (hours)">
        <Input
          type="number"
          min={1}
          max={720}
          step={1}
          required
          value={refreshHours}
          onChange={(event) => setRefreshHours(event.target.value)}
        />
      </Field>
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onDone}
        >
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive sm:col-span-3" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export function ProjectionCard({ data }: { data: ProjectionData }) {
  const [editing, setEditing] = useState(false)
  const asOfLabel = new Date(`${data.benchmark.asOf}T12:00:00`).toLocaleDateString(
    'en-ZA',
    { month: 'short', year: 'numeric' },
  )

  return (
    <Card>
      <CardContent className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-hand text-xl font-medium">Projected growth</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If your monthly surplus of{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(data.surplus)}
              </span>{' '}
              were set aside today
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing((value) => !value)}
          >
            <Settings2 className="sketch-icon size-3.5" />
            {editing ? 'Close' : 'Settings'}
          </Button>
        </div>

        {editing ? <SettingsForm data={data} onDone={() => setEditing(false)} /> : null}

        {data.surplus <= 0 ? (
          <p className="text-sm text-muted-foreground">
            You don't have a surplus this month, so there's nothing to
            project growth on yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-hand text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  <th className="px-2 py-1.5 text-left">Horizon</th>
                  <th className="px-2 py-1.5 text-right">
                    Savings ({data.settings.savingsRate}%)
                  </th>
                  <th className="px-2 py-1.5 text-right">
                    Investment ({data.benchmark.label})
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.projections.map((point) => (
                  <tr key={point.years} className="sketch-divider">
                    <td className="px-2 py-2 font-hand font-medium">
                      {point.years} {point.years === 1 ? 'year' : 'years'}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatCurrency(point.savingsValue)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">
                      {formatCurrency(point.investmentValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Investment rate based on {data.benchmark.label}'s trailing 5-year
          average annual return, updated {asOfLabel}
          {data.benchmark.usingLiveData ? '' : ' (simulated — add ALPHA_VANTAGE_API_KEY for live data)'}
          .
        </p>
      </CardContent>
    </Card>
  )
}
