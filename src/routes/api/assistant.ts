import { createFileRoute } from '@tanstack/react-router'

import {
  buildFallbackAssistantResponse,
  parseAssistantResponse,
  resolveNameToCatalogIds,
  validateAssistantAction,
  type AssistantContext,
  type AssistantMessage,
  type AssistantRequestBody,
  type AssistantResponse,
} from '@/lib/assistant-data'

const SYSTEM_INSTRUCTION = `You are a helpful budgeting assistant embedded in a personal finance app called Nocturne Finance.
You can help users add transactions, create accounts/categories, navigate the app, and favorite stocks.

You MUST respond with valid JSON only — no markdown fences, no extra text. Schema:
{
  "reply": "short friendly message (1-3 sentences)",
  "pills": [{ "id": "unique-id", "label": "Pill text", "kind": "category|account|confirm|navigate|stock|ledger_type", "payload": {} }],
  "action": null | { action object },
  "draft": null | { partial transaction fields }
}

Action types (only set "action" when ALL required fields are known and validated against catalogs):
- create_transaction: { "type": "create_transaction", "name": string, "amount": integer whole units, "ledgerType": "income"|"expense", "categoryId": number, "accountId": number, "occurredAt": "YYYY-MM-DD" }
- create_account: { "type": "create_account", "name": string }
- create_category: { "type": "create_category", "name": string, "ledgerType": "income"|"expense" }
- navigate: { "type": "navigate", "path": "/"|"/income"|"/expenses"|"/accounts"|"/categories"|"/net-worth"|"/stocks" }
- toggle_stock_favorite: { "type": "toggle_stock_favorite", "symbol": string }

Rules:
- All amounts use the app's configured currency from context.currency — never ask the user which currency to use.
- Amounts must be whole integers (no cents). Users may omit the currency symbol (e.g. "500" means 500 in app currency).
- When displaying amounts in "reply", format them consistently with the app currency (e.g. ZAR → "R 500").
- ONLY use categoryId and accountId values from the provided catalogs — never invent IDs.
- If the user wants to add a transaction but category or account is missing, return matching pills and keep action null. Include a "draft" with parsed fields.
- When asking for category, return pills with kind "category" filtered to the correct ledgerType.
- When asking for account, return pills with kind "account".
- Include a confirm pill (kind "confirm") when action is ready to execute.
- For navigation requests, set action immediately with the correct path.
- Use today's date from context when occurredAt is omitted.
- Do not give regulated financial advice.
- Keep replies concise and conversational.`

function buildUserContent(body: AssistantRequestBody) {
  const payload = {
    today: body.context.today,
    summary: body.context.summary,
    catalogs: body.context.catalogs,
    stocks: body.context.stocks,
    recentTransactions: body.context.recentTransactions,
    draft: body.draft ?? null,
    history: body.history.slice(-8),
    message: body.message,
  }

  return `${JSON.stringify(payload, null, 2)}

Respond to the latest user message using only the data above.`
}

function parseRequestBody(data: unknown): AssistantRequestBody {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid request body.')
  }

  const record = data as Record<string, unknown>

  if (typeof record.message !== 'string' || record.message.trim().length === 0) {
    throw new Error('Message is required.')
  }

  if (typeof record.context !== 'object' || record.context === null) {
    throw new Error('Context is required.')
  }

  const context = record.context as AssistantContext
  const history = Array.isArray(record.history)
    ? (record.history.filter(isHistoryMessage) as AssistantMessage[])
    : []

  return {
    message: record.message.trim(),
    history,
    draft:
      typeof record.draft === 'object' && record.draft !== null
        ? (record.draft as AssistantRequestBody['draft'])
        : undefined,
    context,
  }
}

function isHistoryMessage(value: unknown): value is AssistantMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    (record.role === 'user' || record.role === 'assistant') &&
    typeof record.content === 'string'
  )
}

async function callGemini(
  apiKey: string,
  body: AssistantRequestBody,
): Promise<AssistantResponse> {
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: buildUserContent(body) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
      },
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

  const parsed = parseAssistantResponse(JSON.parse(text))
  if (!parsed) {
    throw new Error('Gemini returned invalid JSON shape.')
  }

  return parsed
}

function sanitizeResponse(
  response: AssistantResponse,
  body: AssistantRequestBody,
): AssistantResponse {
  const draft = response.draft
    ? resolveNameToCatalogIds(response.draft, body.context.catalogs)
    : body.draft
      ? resolveNameToCatalogIds(body.draft, body.context.catalogs)
      : null

  const action = response.action
    ? validateAssistantAction(response.action, body.context.catalogs)
    : null

  return {
    ...response,
    draft,
    action,
  }
}

export const Route = createFileRoute('/api/assistant')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: AssistantRequestBody

        try {
          body = parseRequestBody(await request.json())
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
          const result = sanitizeResponse(
            buildFallbackAssistantResponse(body),
            body,
          )
          return Response.json({
            ...result,
            source: 'fallback' as const,
            error: 'GEMINI_API_KEY is not configured.',
          })
        }

        try {
          const result = sanitizeResponse(await callGemini(apiKey, body), body)
          return Response.json(result)
        } catch (error) {
          const result = sanitizeResponse(
            buildFallbackAssistantResponse(body),
            body,
          )
          return Response.json({
            ...result,
            source: 'fallback' as const,
            error: error instanceof Error ? error.message : 'Assistant failed.',
          })
        }
      },
    },
  },
})
