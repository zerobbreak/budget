export type LedgerType = 'income' | 'expense'

export type TransactionItem = {
  id: number
  name: string
  account: string
  accountId: number
  category: string
  categoryId: number
  amount: number
  type: LedgerType
  occurredAt: string
}

export type OverviewData = {
  summary: {
    income: number
    expenses: number
    net: number
  }
  transactions: TransactionItem[]
}

export type IncomeData = {
  total: number
  transactions: TransactionItem[]
}

export type ExpensesData = {
  total: number
  transactions: TransactionItem[]
}

export type AccountRow = {
  id: number
  name: string
  income: number
  expenses: number
  balance: number
}

export type AccountsData = {
  accounts: AccountRow[]
}

export type CategoryRow = {
  id: number
  name: string
  type: LedgerType
  total: number
}

export type CategoriesData = {
  categories: CategoryRow[]
}

export type NetWorthData = {
  total: number
  accounts: AccountRow[]
}

export type CatalogAccount = {
  id: number
  name: string
}

export type CatalogCategory = {
  id: number
  name: string
  type: LedgerType
}

export type FinanceCatalogs = {
  accounts: CatalogAccount[]
  categories: CatalogCategory[]
}

export type MonthFinanceData = {
  overview: OverviewData
  income: IncomeData
  expenses: ExpensesData
  accounts: AccountsData
  categories: CategoriesData
  netWorth: NetWorthData
  catalogs: FinanceCatalogs
}

export type ParsedTransactionInput = {
  name: string
  amount: number
  type: LedgerType
  accountId: number
  categoryId: number
  occurredAt: Date
}
