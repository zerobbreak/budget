import { useCallback, useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProjectionData } from '@/projection.types'

type CategoryBreakdown = {
  name: string
  type: 'income' | 'expense'
  total: number
}

type InsightType = 'recap' | 'projection'

type InsightsResponse = {
  insight: string
  source: 'gemini' | 'fallback'
  error?: string
}

async function requestInsight(
  insightType: InsightType,
  income: number,
  expenses: number,
  surplus: number,
  categories: CategoryBreakdown[],
  projection: ProjectionData | null,
): Promise<InsightsResponse> {
  const fiveYear = projection?.projections.find((point) => point.years === 5)

  const response = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      income,
      expenses,
      surplus,
      categories,
      insightType,
      projection:
        projection && fiveYear
          ? {
              horizonYears: fiveYear.years,
              savingsValue: fiveYear.savingsValue,
              investmentValue: fiveYear.investmentValue,
              benchmarkLabel: projection.benchmark.label,
            }
          : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(`Insights request failed (${response.status}).`)
  }

  return (await response.json()) as InsightsResponse
}

const INSIGHT_TABS: Array<{ id: InsightType; label: string }> = [
  { id: 'recap', label: 'Monthly recap' },
  { id: 'projection', label: 'Growth projection' },
]

export function InsightsPanel({
  income,
  expenses,
  surplus,
  categories,
  projection,
}: {
  income: number
  expenses: number
  surplus: number
  categories: CategoryBreakdown[]
  projection: ProjectionData | null
}) {
  const [insightType, setInsightType] = useState<InsightType>('recap')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InsightsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (type: InsightType) => {
      setLoading(true)
      setError(null)

      try {
        const response = await requestInsight(
          type,
          income,
          expenses,
          surplus,
          categories,
          projection,
        )
        setResult(response)
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Something went wrong.',
        )
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    // categories/projection identity changes each loader run; that's fine, we only care about the trigger.
    [income, expenses, surplus, categories, projection],
  )

  useEffect(() => {
    void load(insightType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightType])

  return (
    <Card>
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="sketch-icon size-4 text-primary" />
            <h2 className="font-hand text-xl font-medium">AI insights</h2>
          </div>
          <div className="flex gap-1 rounded-lg border border-input p-1">
            {INSIGHT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInsightType(tab.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium tracking-[0.05em] uppercase transition-colors',
                  insightType === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Thinking…</p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            Couldn't load insights right now. {error}
          </p>
        ) : result ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-foreground">
              {result.insight}
            </p>
            {result.source === 'fallback' ? (
              <p className="text-xs text-muted-foreground">
                Showing a template summary — add GEMINI_API_KEY for AI-generated
                insights.
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void load(insightType)}
        >
          {loading ? 'Generating…' : 'Regenerate'}
        </Button>
      </CardContent>
    </Card>
  )
}
