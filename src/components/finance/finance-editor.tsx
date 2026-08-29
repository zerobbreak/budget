import { createContext, use, useState, type ReactNode } from 'react'

import { AccountSheet } from '@/components/finance/account-sheet'
import { CategorySheet } from '@/components/finance/category-sheet'
import { FinanceAssistant } from '@/components/finance/finance-assistant'
import { TransactionSheet } from '@/components/finance/transaction-sheet'
import type {
  AccountRow,
  CategoryRow,
  FinanceCatalogs,
  LedgerType,
  TransactionItem,
} from '@/finance.functions'

type TransactionDraft = {
  transaction?: TransactionItem
  defaultType: LedgerType
  lockType: boolean
}

type CategoryDraft = {
  category?: CategoryRow
  defaultType: LedgerType
}

type FinanceEditorValue = {
  addTransaction: (options?: { type?: LedgerType; lockType?: boolean }) => void
  editTransaction: (transaction: TransactionItem) => void
  addAccount: () => void
  editAccount: (account: AccountRow) => void
  addCategory: (options?: { type?: LedgerType }) => void
  editCategory: (category: CategoryRow) => void
}

const FinanceEditorContext = createContext<FinanceEditorValue | null>(null)

export function FinanceEditor({
  catalogs,
  children,
}: {
  catalogs: FinanceCatalogs
  children: ReactNode
}) {
  const [transactionDraft, setTransactionDraft] =
    useState<TransactionDraft | null>(null)
  const [account, setAccount] = useState<AccountRow | null | undefined>(
    undefined,
  )
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null)

  const value: FinanceEditorValue = {
    addTransaction: (options) =>
      setTransactionDraft({
        defaultType: options?.type ?? 'expense',
        lockType: options?.lockType ?? false,
      }),
    editTransaction: (transaction) =>
      setTransactionDraft({
        transaction,
        defaultType: transaction.type,
        lockType: false,
      }),
    addAccount: () => setAccount(null),
    editAccount: (nextAccount) => setAccount(nextAccount),
    addCategory: (options) =>
      setCategoryDraft({
        defaultType: options?.type ?? 'expense',
      }),
    editCategory: (category) =>
      setCategoryDraft({
        category,
        defaultType: category.type,
      }),
  }

  return (
    <FinanceEditorContext value={value}>
      {children}
      <TransactionSheet
        open={transactionDraft !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionDraft(null)
          }
        }}
        catalogs={catalogs}
        transaction={transactionDraft?.transaction}
        defaultType={transactionDraft?.defaultType}
        lockType={transactionDraft?.lockType}
      />
      <AccountSheet
        open={account !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setAccount(undefined)
          }
        }}
        account={account ?? undefined}
      />
      <CategorySheet
        open={categoryDraft !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryDraft(null)
          }
        }}
        category={categoryDraft?.category}
        defaultType={categoryDraft?.defaultType}
      />
      <FinanceAssistant />
    </FinanceEditorContext>
  )
}

export function useFinanceEditor() {
  const value = use(FinanceEditorContext)

  if (!value) {
    throw new Error('useFinanceEditor must be used inside FinanceEditor.')
  }

  return value
}
