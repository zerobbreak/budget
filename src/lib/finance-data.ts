export type NavItem = {
  id: string
  label: string
  letter: string
  to:
    | '/'
    | '/income'
    | '/expenses'
    | '/accounts'
    | '/categories'
    | '/net-worth'
    | '/stocks'
}

export type Transaction = {
  id: number
  name: string
  account: string
  accountId?: number
  category: string
  categoryId?: number
  amount: number
  type: 'income' | 'expense'
  occurredAt?: string
}

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', letter: 'O', to: '/' },
  { id: 'income', label: 'Income', letter: 'I', to: '/income' },
  { id: 'expenses', label: 'Expenses', letter: 'E', to: '/expenses' },
  { id: 'accounts', label: 'Accounts', letter: 'A', to: '/accounts' },
  { id: 'categories', label: 'Categories', letter: 'C', to: '/categories' },
  { id: 'net-worth', label: 'Net worth', letter: 'N', to: '/net-worth' },
  { id: 'stocks', label: 'Stocks', letter: 'S', to: '/stocks' },
]

/** How long finance loader data stays fresh across sidebar navigation. */
export const FINANCE_STALE_TIME_MS = 5 * 60 * 1000

/** App-wide currency — used for formatting and assistant parsing (no need to specify in chat). */
export const APP_CURRENCY = {
  locale: 'en-ZA',
  code: 'ZAR',
} as const

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(APP_CURRENCY.locale, {
    style: 'currency',
    currency: APP_CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Parse a whole-number amount from natural language; a currency symbol is optional. */
export function parseCurrencyAmount(text: string) {
  const match =
    text.match(/\b(?:R\s?)?(\d[\d\s,]*)\b/i) ?? text.match(/\b(\d[\d\s,]+)\b/)

  if (!match) {
    return undefined
  }

  const value = Number(match[1].replace(/[\s,]/g, ''))
  return Number.isInteger(value) && value > 0 ? value : undefined
}
