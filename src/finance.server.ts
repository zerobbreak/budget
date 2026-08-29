import '@tanstack/react-start/server-only'

import { getPrisma } from './db.js'
import type {
  AccountRow,
  CategoryRow,
  LedgerType,
  MonthFinanceData,
  ParsedTransactionInput,
  TransactionItem,
} from './finance.types.js'

type PrismaTransaction = Awaited<ReturnType<typeof getMonthTransactions>>[number]

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return { start, end }
}

function toLedgerType(type: 'INCOME' | 'EXPENSE'): LedgerType {
  return type === 'INCOME' ? 'income' : 'expense'
}

function toDbType(type: LedgerType): 'INCOME' | 'EXPENSE' {
  return type === 'income' ? 'INCOME' : 'EXPENSE'
}

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toTransactionItem(transaction: PrismaTransaction): TransactionItem {
  return {
    id: transaction.id,
    name: transaction.name,
    account: transaction.account.name,
    accountId: transaction.accountId,
    category: transaction.category.name,
    categoryId: transaction.categoryId,
    amount: transaction.amount,
    type: toLedgerType(transaction.type),
    occurredAt: toDateInput(transaction.occurredAt),
  }
}

async function getMonthTransactions() {
  const { start, end } = getCurrentMonthRange()

  return getPrisma().transaction.findMany({
    where: {
      occurredAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      account: true,
      category: true,
    },
    orderBy: {
      occurredAt: 'desc',
    },
  })
}

function sumByType(transactions: PrismaTransaction[], type: 'INCOME' | 'EXPENSE') {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0)
}

function buildAccountRows(
  transactions: PrismaTransaction[],
  accounts: Array<{ id: number; name: string }>,
) {
  const rows = new Map<number, AccountRow>()

  for (const account of accounts) {
    rows.set(account.id, {
      id: account.id,
      name: account.name,
      income: 0,
      expenses: 0,
      balance: 0,
    })
  }

  for (const transaction of transactions) {
    const existing = rows.get(transaction.accountId)

    if (!existing) {
      continue
    }

    if (transaction.type === 'INCOME') {
      existing.income += transaction.amount
      existing.balance += transaction.amount
    } else {
      existing.expenses += transaction.amount
      existing.balance -= transaction.amount
    }
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function buildCategoryRows(
  transactions: PrismaTransaction[],
  categories: Array<{ id: number; name: string; type: 'INCOME' | 'EXPENSE' }>,
) {
  const rows = new Map<number, CategoryRow>()

  for (const category of categories) {
    rows.set(category.id, {
      id: category.id,
      name: category.name,
      type: toLedgerType(category.type),
      total: 0,
    })
  }

  for (const transaction of transactions) {
    const existing = rows.get(transaction.categoryId)

    if (!existing) {
      continue
    }

    existing.total += transaction.amount
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function deriveMonthFinance(
  monthTransactions: PrismaTransaction[],
  accounts: Array<{ id: number; name: string }>,
  categories: Array<{ id: number; name: string; type: 'INCOME' | 'EXPENSE' }>,
): MonthFinanceData {
  const income = sumByType(monthTransactions, 'INCOME')
  const expenses = sumByType(monthTransactions, 'EXPENSE')
  const accountRows = buildAccountRows(monthTransactions, accounts)
  const items = monthTransactions.map(toTransactionItem)

  return {
    overview: {
      summary: {
        income,
        expenses,
        net: income - expenses,
      },
      transactions: items,
    },
    income: {
      total: income,
      transactions: items.filter((transaction) => transaction.type === 'income'),
    },
    expenses: {
      total: expenses,
      transactions: items.filter((transaction) => transaction.type === 'expense'),
    },
    accounts: { accounts: accountRows },
    categories: { categories: buildCategoryRows(monthTransactions, categories) },
    netWorth: {
      total: accountRows.reduce((sum, account) => sum + account.balance, 0),
      accounts: accountRows,
    },
    catalogs: {
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        type: toLedgerType(category.type),
      })),
    },
  }
}

function prismaCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
}

function rethrowPrisma(error: unknown): never {
  const code = prismaCode(error)

  if (code === 'P2002') {
    throw new Error('That name is already used.')
  }

  if (code === 'P2003' || code === 'P2014') {
    throw new Error(
      'This category still has transactions. Move or delete them first.',
    )
  }

  if (code === 'P2025') {
    throw new Error('That record was already removed.')
  }

  throw error
}

async function assertTransactionRelations(
  accountId: number,
  categoryId: number,
  type: LedgerType,
) {
  const prisma = getPrisma()
  const [account, category] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.category.findUnique({ where: { id: categoryId } }),
  ])

  if (!account) {
    throw new Error('Choose an account that still exists.')
  }

  if (!category) {
    throw new Error('Choose a category that still exists.')
  }

  if (toLedgerType(category.type) !== type) {
    throw new Error('That category does not match the income/expense type.')
  }
}

export async function getMonthFinanceData(): Promise<MonthFinanceData> {
  const prisma = getPrisma()
  const [monthTransactions, accounts, categories] = await Promise.all([
    getMonthTransactions(),
    prisma.account.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  return deriveMonthFinance(monthTransactions, accounts, categories)
}

export async function createTransactionRecord(data: ParsedTransactionInput) {
  await assertTransactionRelations(data.accountId, data.categoryId, data.type)

  try {
    await getPrisma().transaction.create({
      data: {
        name: data.name,
        amount: data.amount,
        type: toDbType(data.type),
        accountId: data.accountId,
        categoryId: data.categoryId,
        occurredAt: data.occurredAt,
      },
    })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function updateTransactionRecord(
  id: number,
  data: ParsedTransactionInput,
) {
  await assertTransactionRelations(data.accountId, data.categoryId, data.type)

  try {
    await getPrisma().transaction.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        type: toDbType(data.type),
        accountId: data.accountId,
        categoryId: data.categoryId,
        occurredAt: data.occurredAt,
      },
    })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function deleteTransactionRecord(id: number) {
  try {
    await getPrisma().transaction.delete({ where: { id } })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function createAccountRecord(name: string) {
  try {
    await getPrisma().account.create({ data: { name } })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function updateAccountRecord(id: number, name: string) {
  try {
    await getPrisma().account.update({
      where: { id },
      data: { name },
    })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function deleteAccountRecord(id: number) {
  try {
    await getPrisma().account.delete({ where: { id } })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function createCategoryRecord(name: string, type: LedgerType) {
  try {
    await getPrisma().category.create({
      data: {
        name,
        type: toDbType(type),
      },
    })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function updateCategoryRecord(
  id: number,
  name: string,
  type: LedgerType,
) {
  const prisma = getPrisma()
  const existing = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  })

  if (!existing) {
    throw new Error('That category was already removed.')
  }

  if (
    existing.type !== toDbType(type) &&
    existing._count.transactions > 0
  ) {
    throw new Error(
      'This category already has transactions, so its type cannot change.',
    )
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name,
        type: toDbType(type),
      },
    })
  } catch (error) {
    rethrowPrisma(error)
  }
}

export async function deleteCategoryRecord(id: number) {
  const prisma = getPrisma()
  const existing = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  })

  if (!existing) {
    throw new Error('That category was already removed.')
  }

  if (existing._count.transactions > 0) {
    throw new Error(
      'This category still has transactions. Move or delete them first.',
    )
  }

  try {
    await prisma.category.delete({ where: { id } })
  } catch (error) {
    rethrowPrisma(error)
  }
}
