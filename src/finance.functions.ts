import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from './auth.functions.js'
import type {
  LedgerType,
  MonthFinanceData,
  ParsedTransactionInput,
} from './finance.types.js'

export type {
  AccountRow,
  AccountsData,
  CatalogAccount,
  CatalogCategory,
  CategoriesData,
  CategoryRow,
  ExpensesData,
  FinanceCatalogs,
  IncomeData,
  LedgerType,
  MonthFinanceData,
  NetWorthData,
  OverviewData,
  TransactionItem,
} from './finance.types.js'

function requireObject(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid request.')
  }

  return data as Record<string, unknown>
}

function requireId(value: unknown, label = 'Record') {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`${label} is invalid.`)
  }

  return value
}

function requireName(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Enter a name.')
  }

  const name = value.trim()

  if (name.length === 0) {
    throw new Error('Enter a name.')
  }

  if (name.length > 80) {
    throw new Error('Keep names to 80 characters or fewer.')
  }

  return name
}

function requireLedgerType(value: unknown): LedgerType {
  if (value !== 'income' && value !== 'expense') {
    throw new Error('Choose income or expense.')
  }

  return value
}

function requireAmount(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Enter an amount as a whole number.')
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Amount must be a whole number of at least 1.')
  }

  if (value > 1_000_000_000) {
    throw new Error('That amount is too large.')
  }

  return value
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Enter a valid date.')
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Enter a valid date.')
  }

  return date
}

function parseTransactionInput(data: unknown): ParsedTransactionInput {
  const input = requireObject(data)

  return {
    name: requireName(input.name),
    amount: requireAmount(input.amount),
    type: requireLedgerType(input.type),
    accountId: requireId(input.accountId, 'Account'),
    categoryId: requireId(input.categoryId, 'Category'),
    occurredAt: parseDateInput(
      typeof input.occurredAt === 'string' ? input.occurredAt : '',
    ),
  }
}

export const getMonthFinance = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MonthFinanceData> => {
    const session = await ensureSession()
    const { getMonthFinanceData } = await import('./finance.server.js')
    return getMonthFinanceData(session.user.id)
  },
)

export const createTransaction = createServerFn({ method: 'POST' })
  .validator((data: unknown) => parseTransactionInput(data))
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { createTransactionRecord } = await import('./finance.server.js')
    await createTransactionRecord(session.user.id, data)
    return { ok: true as const }
  })

export const updateTransaction = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const input = requireObject(data)

    return {
      id: requireId(input.id, 'Transaction'),
      ...parseTransactionInput(input),
    }
  })
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { updateTransactionRecord } = await import('./finance.server.js')
    await updateTransactionRecord(session.user.id, data.id, data)
    return { ok: true as const }
  })

export const deleteTransaction = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    id: requireId(requireObject(data).id, 'Transaction'),
  }))
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { deleteTransactionRecord } = await import('./finance.server.js')
    await deleteTransactionRecord(session.user.id, data.id)
    return { ok: true as const }
  })

export const createAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    name: requireName(requireObject(data).name),
  }))
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { createAccountRecord } = await import('./finance.server.js')
    await createAccountRecord(session.user.id, data.name)
    return { ok: true as const }
  })

export const updateAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const input = requireObject(data)

    return {
      id: requireId(input.id, 'Account'),
      name: requireName(input.name),
    }
  })
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { updateAccountRecord } = await import('./finance.server.js')
    await updateAccountRecord(session.user.id, data.id, data.name)
    return { ok: true as const }
  })

export const deleteAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    id: requireId(requireObject(data).id, 'Account'),
  }))
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { deleteAccountRecord } = await import('./finance.server.js')
    await deleteAccountRecord(session.user.id, data.id)
    return { ok: true as const }
  })

export const createCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const input = requireObject(data)

    return {
      name: requireName(input.name),
      type: requireLedgerType(input.type),
    }
  })
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { createCategoryRecord } = await import('./finance.server.js')
    await createCategoryRecord(session.user.id, data.name, data.type)
    return { ok: true as const }
  })

export const updateCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const input = requireObject(data)

    return {
      id: requireId(input.id, 'Category'),
      name: requireName(input.name),
      type: requireLedgerType(input.type),
    }
  })
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { updateCategoryRecord } = await import('./finance.server.js')
    await updateCategoryRecord(session.user.id, data.id, data.name, data.type)
    return { ok: true as const }
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    id: requireId(requireObject(data).id, 'Category'),
  }))
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { deleteCategoryRecord } = await import('./finance.server.js')
    await deleteCategoryRecord(session.user.id, data.id)
    return { ok: true as const }
  })
