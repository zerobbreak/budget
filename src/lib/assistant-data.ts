import type { FinanceCatalogs, LedgerType } from '@/finance.types'
import {
  formatCurrency,
  navItems,
  parseCurrencyAmount,
} from '@/lib/finance-data'
import { CURATED_STOCKS } from '@/lib/stocks-data'

export type AssistantPillKind =
  | 'category'
  | 'account'
  | 'confirm'
  | 'navigate'
  | 'stock'
  | 'ledger_type'

export type AssistantPill = {
  id: string
  label: string
  kind: AssistantPillKind
  payload: Record<string, unknown>
}

export type AssistantAction =
  | {
      type: 'create_transaction'
      name: string
      amount: number
      ledgerType: LedgerType
      categoryId: number
      accountId: number
      occurredAt: string
    }
  | { type: 'create_account'; name: string }
  | { type: 'create_category'; name: string; ledgerType: LedgerType }
  | { type: 'navigate'; path: (typeof navItems)[number]['to'] }
  | { type: 'toggle_stock_favorite'; symbol: string }

export type AssistantDraft = {
  ledgerType?: LedgerType
  name?: string
  amount?: number
  categoryId?: number
  accountId?: number
  occurredAt?: string
  accountName?: string
  categoryName?: string
}

export type AssistantMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AssistantContext = {
  today: string
  currency: { code: string; locale: string }
  summary: { income: number; expenses: number; net: number }
  catalogs: FinanceCatalogs
  stocks: Array<{ symbol: string; name: string }>
  recentTransactions: Array<{
    name: string
    amount: number
    type: LedgerType
    category: string
    account: string
  }>
}

export type AssistantRequestBody = {
  message: string
  history: AssistantMessage[]
  draft?: AssistantDraft
  context: AssistantContext
}

export type AssistantResponse = {
  reply: string
  pills: AssistantPill[]
  action: AssistantAction | null
  draft: AssistantDraft | null
  source: 'gemini' | 'fallback'
  error?: string
}

const NAV_PATHS = new Set(navItems.map((item) => item.to))

function todayInput() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function findCategory(catalogs: FinanceCatalogs, name: string, type?: LedgerType) {
  const needle = name.trim().toLowerCase()
  return catalogs.categories.find(
    (category) =>
      category.name.toLowerCase() === needle &&
      (type ? category.type === type : true),
  )
}

function findAccount(catalogs: FinanceCatalogs, name: string) {
  const needle = name.trim().toLowerCase()
  return catalogs.accounts.find((account) => account.name.toLowerCase() === needle)
}

function mergeDraft(
  draft: AssistantDraft | undefined,
  patch: AssistantDraft,
): AssistantDraft {
  return { ...draft, ...patch }
}

export function applyPillToDraft(
  draft: AssistantDraft | undefined,
  pill: AssistantPill,
): AssistantDraft {
  switch (pill.kind) {
    case 'ledger_type':
      return mergeDraft(draft, {
        ledgerType: pill.payload.ledgerType as LedgerType,
      })
    case 'category':
      return mergeDraft(draft, {
        categoryId: pill.payload.categoryId as number,
        categoryName: pill.label,
      })
    case 'account':
      return mergeDraft(draft, {
        accountId: pill.payload.accountId as number,
        accountName: pill.label,
      })
    case 'stock':
      return draft ?? {}
    case 'navigate':
    case 'confirm':
      return draft ?? {}
    default:
      return draft ?? {}
  }
}

export function validateAssistantAction(
  action: AssistantAction,
  catalogs: FinanceCatalogs,
): AssistantAction | null {
  switch (action.type) {
    case 'create_transaction': {
      const category = catalogs.categories.find(
        (item) => item.id === action.categoryId,
      )
      const account = catalogs.accounts.find(
        (item) => item.id === action.accountId,
      )

      if (
        !category ||
        !account ||
        category.type !== action.ledgerType ||
        !Number.isInteger(action.amount) ||
        action.amount < 1 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(action.occurredAt) ||
        action.name.trim().length === 0
      ) {
        return null
      }

      return action
    }
    case 'create_account':
      return action.name.trim().length > 0 ? action : null
    case 'create_category':
      return action.name.trim().length > 0 ? action : null
    case 'navigate':
      return NAV_PATHS.has(action.path) ? action : null
    case 'toggle_stock_favorite':
      return CURATED_STOCKS.some((stock) => stock.symbol === action.symbol)
        ? action
        : null
    default:
      return null
  }
}

function categoryPills(
  catalogs: FinanceCatalogs,
  ledgerType: LedgerType,
): AssistantPill[] {
  return catalogs.categories
    .filter((category) => category.type === ledgerType)
    .map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      kind: 'category' as const,
      payload: { categoryId: category.id },
    }))
}

function accountPills(catalogs: FinanceCatalogs): AssistantPill[] {
  return catalogs.accounts.map((account) => ({
    id: `account-${account.id}`,
    label: account.name,
    kind: 'account' as const,
    payload: { accountId: account.id },
  }))
}

function buildTransactionFromDraft(
  draft: AssistantDraft,
  catalogs: FinanceCatalogs,
): AssistantAction | null {
  if (
    !draft.ledgerType ||
    !draft.name ||
    !draft.amount ||
    !draft.categoryId ||
    !draft.accountId
  ) {
    return null
  }

  return validateAssistantAction(
    {
      type: 'create_transaction',
      name: draft.name,
      amount: draft.amount,
      ledgerType: draft.ledgerType,
      categoryId: draft.categoryId,
      accountId: draft.accountId,
      occurredAt: draft.occurredAt ?? todayInput(),
    },
    catalogs,
  )
}

function parseAmount(text: string) {
  return parseCurrencyAmount(text)
}

function extractTransactionName(message: string, ledgerType: LedgerType) {
  const cleaned = message
    .replace(/\b(add|create|record|log|new)\b/gi, '')
    .replace(/\b(income|expense|expenses)\b/gi, '')
    .replace(/\bR?\s?\d[\d\s,]*/gi, '')
    .replace(/\b(for|on|under|in|to|category|account)\b/gi, '')
    .trim()

  if (cleaned.length === 0) {
    return ledgerType === 'income' ? 'Income' : 'Expense'
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export function buildFallbackAssistantResponse(
  body: AssistantRequestBody,
): AssistantResponse {
  const { message, context, draft: incomingDraft } = body
  const text = message.trim().toLowerCase()
  const draft = incomingDraft ?? {}

  if (text.includes('stock') || text.includes('favorite')) {
    const stock = CURATED_STOCKS.find(
      (item) =>
        text.includes(item.symbol.toLowerCase()) ||
        text.includes(item.name.toLowerCase()),
    )

    if (stock) {
      return {
        reply: `I can star ${stock.name} (${stock.symbol}) on your watchlist.`,
        pills: [
          {
            id: `confirm-stock-${stock.symbol}`,
            label: `Star ${stock.symbol}`,
            kind: 'confirm',
            payload: { symbol: stock.symbol },
          },
        ],
        action: {
          type: 'toggle_stock_favorite',
          symbol: stock.symbol,
        },
        draft: null,
        source: 'fallback',
      }
    }

    return {
      reply: 'Pick a stock to favorite from your watchlist.',
      pills: CURATED_STOCKS.map((stock) => ({
        id: `stock-${stock.symbol}`,
        label: stock.symbol,
        kind: 'stock',
        payload: { symbol: stock.symbol },
      })),
      action: null,
      draft: null,
      source: 'fallback',
    }
  }

  for (const item of navItems) {
    if (text.includes(item.label.toLowerCase()) || text.includes(item.id)) {
      return {
        reply: `Opening ${item.label}.`,
        pills: [
          {
            id: `nav-${item.id}`,
            label: item.label,
            kind: 'navigate',
            payload: { path: item.to },
          },
        ],
        action: { type: 'navigate', path: item.to },
        draft: null,
        source: 'fallback',
      }
    }
  }

  if (
    text.includes('surplus') ||
    text.includes('balance') ||
    text.includes('how much') ||
    text.includes('summary')
  ) {
    const { income, expenses, net } = context.summary
    return {
      reply: `This month you've recorded ${formatCurrency(income)} income and ${formatCurrency(expenses)} expenses, leaving a ${net >= 0 ? 'surplus' : 'shortfall'} of ${formatCurrency(Math.abs(net))}.`,
      pills: [
        {
          id: 'nav-overview',
          label: 'Overview',
          kind: 'navigate',
          payload: { path: '/' },
        },
        {
          id: 'nav-income',
          label: 'Income',
          kind: 'navigate',
          payload: { path: '/income' },
        },
      ],
      action: null,
      draft: null,
      source: 'fallback',
    }
  }

  const ledgerType: LedgerType | undefined = text.includes('income')
    ? 'income'
    : text.includes('expense')
      ? 'expense'
      : draft.ledgerType

  if (ledgerType && (text.includes('add') || text.includes('record') || draft.name)) {
    const nextDraft = mergeDraft(draft, {
      ledgerType,
      amount: draft.amount ?? parseAmount(message),
      name: draft.name ?? extractTransactionName(message, ledgerType),
      occurredAt: draft.occurredAt ?? context.today,
    })

    const categoryMatch = context.catalogs.categories.find((category) =>
      text.includes(category.name.toLowerCase()),
    )
    if (categoryMatch && categoryMatch.type === ledgerType) {
      nextDraft.categoryId = categoryMatch.id
      nextDraft.categoryName = categoryMatch.name
    }

    const accountMatch = context.catalogs.accounts.find((account) =>
      text.includes(account.name.toLowerCase()),
    )
    if (accountMatch) {
      nextDraft.accountId = accountMatch.id
      nextDraft.accountName = accountMatch.name
    }

    const action = buildTransactionFromDraft(nextDraft, context.catalogs)
    if (action && action.type === 'create_transaction') {
      return {
        reply: `Ready to add ${action.ledgerType} "${action.name}" for ${formatCurrency(action.amount)}.`,
        pills: [
          {
            id: 'confirm-transaction',
            label: 'Confirm & save',
            kind: 'confirm',
            payload: {},
          },
        ],
        action,
        draft: nextDraft,
        source: 'fallback',
      }
    }

    const pills: AssistantPill[] = []
    if (!nextDraft.categoryId) {
      pills.push(...categoryPills(context.catalogs, ledgerType))
    }
    if (!nextDraft.accountId) {
      pills.push(...accountPills(context.catalogs))
    }

    const missing: string[] = []
    if (!nextDraft.amount) missing.push('amount')
    if (!nextDraft.categoryId) missing.push('category')
    if (!nextDraft.accountId) missing.push('account')

    return {
      reply:
        missing.length > 0
          ? `Got it — I still need ${missing.join(', ')} for this ${ledgerType}. Tap a pill below or type the details.`
          : `Almost there — confirm the ${ledgerType} details below.`,
      pills,
      action: null,
      draft: nextDraft,
      source: 'fallback',
    }
  }

  return {
    reply:
      'I can add income or expenses, create accounts or categories, favorite stocks, or open any section. Try "Add expense 500 for groceries".',
    pills: [
      {
        id: 'type-expense',
        label: 'Add expense',
        kind: 'ledger_type',
        payload: { ledgerType: 'expense' },
      },
      {
        id: 'type-income',
        label: 'Add income',
        kind: 'ledger_type',
        payload: { ledgerType: 'income' },
      },
      {
        id: 'nav-stocks',
        label: 'Stocks',
        kind: 'navigate',
        payload: { path: '/stocks' },
      },
    ],
    action: null,
    draft: null,
    source: 'fallback',
  }
}

export function parseAssistantResponse(raw: unknown): AssistantResponse | null {
  if (typeof raw !== 'object' || raw === null) {
    return null
  }

  const record = raw as Record<string, unknown>
  const reply = typeof record.reply === 'string' ? record.reply.trim() : ''
  if (!reply) {
    return null
  }

  const pills = Array.isArray(record.pills)
    ? record.pills.filter(isAssistantPill)
    : []

  const draft =
    typeof record.draft === 'object' && record.draft !== null
      ? (record.draft as AssistantDraft)
      : null

  const action = isAssistantAction(record.action) ? record.action : null

  return {
    reply,
    pills,
    action,
    draft,
    source: 'gemini',
  }
}

function isAssistantPill(value: unknown): value is AssistantPill {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.label === 'string' &&
    typeof record.kind === 'string' &&
    typeof record.payload === 'object' &&
    record.payload !== null
  )
}

function isAssistantAction(value: unknown): value is AssistantAction {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  if (record.type === 'create_transaction') {
    return (
      typeof record.name === 'string' &&
      typeof record.amount === 'number' &&
      (record.ledgerType === 'income' || record.ledgerType === 'expense') &&
      typeof record.categoryId === 'number' &&
      typeof record.accountId === 'number' &&
      typeof record.occurredAt === 'string'
    )
  }

  if (record.type === 'create_account') {
    return typeof record.name === 'string'
  }

  if (record.type === 'create_category') {
    return (
      typeof record.name === 'string' &&
      (record.ledgerType === 'income' || record.ledgerType === 'expense')
    )
  }

  if (record.type === 'navigate') {
    return typeof record.path === 'string' && NAV_PATHS.has(record.path as never)
  }

  if (record.type === 'toggle_stock_favorite') {
    return typeof record.symbol === 'string'
  }

  return false
}

export function resolveNameToCatalogIds(
  draft: AssistantDraft,
  catalogs: FinanceCatalogs,
): AssistantDraft {
  const next = { ...draft }

  if (!next.categoryId && next.categoryName) {
    const category = findCategory(
      catalogs,
      next.categoryName,
      next.ledgerType,
    )
    if (category) {
      next.categoryId = category.id
    }
  }

  if (!next.accountId && next.accountName) {
    const account = findAccount(catalogs, next.accountName)
    if (account) {
      next.accountId = account.id
    }
  }

  return next
}
