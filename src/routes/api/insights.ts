import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'
import { APP_CURRENCY, formatCurrency } from '@/lib/finance-data'

type CategoryBreakdown = {
  name: string
  type: 'income' | 'expense'
  total: number
}

type ProjectionSummary = {
  horizonYears: number
  savingsValue: number
  investmentValue: number
  benchmarkLabel: string
}

type InsightsRequestBody = {
  income: number
  expenses: number
  surplus: number
  categories: CategoryBreakdown[]
  projection?: ProjectionSummary
  insightType?: 'recap' | 'projection'
}

type InsightsResponse = {
  insight: string
  source: 'gemini' | 'fallback'
  error?: string
}

const SYSTEM_INSTRUCTION = `You are a concise budgeting assistant embedded in a personal finance app.
You narrate numbers that have ALREADY been calculated by the app — you never perform arithmetic
yourself and you never invent, estimate, or adjust any number that isn't given to you in the input.
Respond in 2-3 short plain-language sentences, in a warm but neutral tone. Do not use the words
"advice", "recommend", or "should invest" — you are not a licensed financial advisor and must not
give regulated financial advice. Do not use markdown formatting.`

function buildUserContent(body: InsightsRequestBody) {
  const topExpense = body.categories
    .filter((category) => category.type === 'expense')
    .sort((a, b) => b.total - a.total)[0]

  const payload = {
    income: body.income,
    expenses: body.expenses,
    surplus: body.surplus,
    topExpenseCategory: topExpense
      ? { name: topExpense.name, total: topExpense.total }
      : null,
    categories: body.categories,
    projection: body.projection ?? null,
    insightType: body.insightType ?? 'recap',
  }

  return `Here is this period's structured budget data (all numbers already computed, currency ${APP_CURRENCY.code}):

${JSON.stringify(payload, null, 2)}

Write the requested insight ("${payload.insightType}") using only these numbers.`
}

function isCategoryBreakdown(value: unknown): value is CategoryBreakdown {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.name === 'string' &&
    (record.type === 'income' || record.type === 'expense') &&
    typeof record.total === 'number'
  )
}

function parseRequestBody(data: unknown): InsightsRequestBody {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid request body.')
  }

  const record = data as Record<string, unknown>

  if (
    typeof record.income !== 'number' ||
    typeof record.expenses !== 'number' ||
    typeof record.surplus !== 'number'
  ) {
    throw new Error('income, expenses, and surplus must be numbers.')
  }

  const categories = Array.isArray(record.categories)
    ? record.categories.filter(isCategoryBreakdown)
    : []

  let projection: ProjectionSummary | undefined

  if (typeof record.projection === 'object' && record.projection !== null) {
    const projectionRecord = record.projection as Record<string, unknown>

    if (
      typeof projectionRecord.horizonYears === 'number' &&
      typeof projectionRecord.savingsValue === 'number' &&
      typeof projectionRecord.investmentValue === 'number' &&
      typeof projectionRecord.benchmarkLabel === 'string'
    ) {
      projection = {
        horizonYears: projectionRecord.horizonYears,
        savingsValue: projectionRecord.savingsValue,
        investmentValue: projectionRecord.investmentValue,
        benchmarkLabel: projectionRecord.benchmarkLabel,
      }
    }
  }

  const insightType =
    record.insightType === 'projection' ? 'projection' : 'recap'

  return {
    income: record.income,
    expenses: record.expenses,
    surplus: record.surplus,
    categories,
    projection,
    insightType,
  }
}

function buildFallbackInsight(body: InsightsRequestBody): string {
  if (body.insightType === 'projection' && body.projection) {
    const { horizonYears, savingsValue, investmentValue, benchmarkLabel } =
      body.projection
    return `At your current monthly surplus of ${formatCurrency(body.surplus)}, saving it could grow to roughly ${formatCurrency(savingsValue)} over ${horizonYears} year${horizonYears === 1 ? '' : 's'}, versus about ${formatCurrency(investmentValue)} if invested in a ${benchmarkLabel} tracker.`
  }

  const topExpense = body.categories
    .filter((category) => category.type === 'expense')
    .sort((a, b) => b.total - a.total)[0]
  const surplusPhrase =
    body.surplus >= 0
      ? `a surplus of ${formatCurrency(body.surplus)}`
      : `a shortfall of ${formatCurrency(Math.abs(body.surplus))}`

  return `This period you brought in ${formatCurrency(body.income)} and spent ${formatCurrency(body.expenses)}, leaving ${surplusPhrase}.${topExpense ? ` Your largest expense category was ${topExpense.name} at ${formatCurrency(topExpense.total)}.` : ''}`
}

async function callGemini(
  apiKey: string,
  body: InsightsRequestBody,
): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: buildUserContent(body) }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Gemini request failed (${response.status}): ${detail.slice(0, 200)}`,
    )
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!text) {
    throw new Error('Gemini returned no text.')
  }

  return text
}

export const Route = createFileRoute('/api/insights')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: InsightsRequestBody

        try {
          const raw = await request.json()
          body = parseRequestBody(raw)
        } catch (error) {
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : 'Invalid request.',
            },
            { status: 400 },
          )
        }

        const apiKey = process.env.GEMINI_API_KEY?.trim()

        if (!apiKey) {
          const result: InsightsResponse = {
            insight: buildFallbackInsight(body),
            source: 'fallback',
            error: 'GEMINI_API_KEY is not configured.',
          }
          return Response.json(result)
        }

        try {
          const insight = await callGemini(apiKey, body)
          const result: InsightsResponse = { insight, source: 'gemini' }
          return Response.json(result)
        } catch (error) {
          const result: InsightsResponse = {
            insight: buildFallbackInsight(body),
            source: 'fallback',
            error:
              error instanceof Error ? error.message : 'Gemini request failed.',
          }
          return Response.json(result)
        }
      },
    },
  },
})
