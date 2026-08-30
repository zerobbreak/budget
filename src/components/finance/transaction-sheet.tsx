import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Field, NativeSelect, TypeToggle } from '@/components/finance/form-field'
import { financeSheetClassName } from '@/components/finance/page-shell'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type FinanceCatalogs,
  type LedgerType,
  type TransactionItem,
} from '@/finance.functions'
import { useFinanceAction } from '@/hooks/use-finance-action'

function todayInput() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

export function TransactionSheet({
  open,
  onOpenChange,
  catalogs,
  transaction,
  defaultType = 'expense',
  lockType = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogs: FinanceCatalogs
  transaction?: TransactionItem
  defaultType?: LedgerType
  lockType?: boolean
}) {
  const isEditing = Boolean(transaction)
  const { run, pending, error, setError } = useFinanceAction()
  const createTransactionFn = useServerFn(createTransaction)
  const updateTransactionFn = useServerFn(updateTransaction)
  const deleteTransactionFn = useServerFn(deleteTransaction)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<LedgerType>(defaultType)
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [occurredAt, setOccurredAt] = useState(todayInput)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categories = useMemo(
    () => catalogs.categories.filter((category) => category.type === type),
    [catalogs.categories, type],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setError(null)
    setConfirmDelete(false)

    if (transaction) {
      setName(transaction.name)
      setAmount(String(transaction.amount))
      setType(transaction.type)
      setAccountId(String(transaction.accountId))
      setCategoryId(String(transaction.categoryId))
      setOccurredAt(transaction.occurredAt)
      return
    }

    const nextType = defaultType
    const firstAccount = catalogs.accounts[0]
    const firstCategory = catalogs.categories.find(
      (category) => category.type === nextType,
    )

    setName('')
    setAmount('')
    setType(nextType)
    setAccountId(firstAccount ? String(firstAccount.id) : '')
    setCategoryId(firstCategory ? String(firstCategory.id) : '')
    setOccurredAt(todayInput())
  }, [open, transaction, defaultType, catalogs, setError])

  function handleTypeChange(nextType: LedgerType) {
    setType(nextType)
    const firstCategory = catalogs.categories.find(
      (category) => category.type === nextType,
    )
    setCategoryId(firstCategory ? String(firstCategory.id) : '')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const parsedAmount = Number(amount)

    try {
      await run(async () => {
        const payload = {
          name,
          amount: parsedAmount,
          type,
          accountId: Number(accountId),
          categoryId: Number(categoryId),
          occurredAt,
        }

        if (transaction) {
          await updateTransactionFn({ data: { id: transaction.id, ...payload } })
        } else {
          await createTransactionFn({ data: payload })
        }
      })
      onOpenChange(false)
    } catch {
      // Error is shown in the sheet.
    }
  }

  async function handleDelete() {
    if (!transaction) {
      return
    }

    try {
      await run(() => deleteTransactionFn({ data: { id: transaction.id } }))
      onOpenChange(false)
    } catch {
      // Error is shown in the sheet.
    }
  }

  const missingAccounts = catalogs.accounts.length === 0
  const missingCategories = categories.length === 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={financeSheetClassName}>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit entry' : 'New entry'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Change the details, or remove this entry from the ledger.'
              : 'Logged amounts show on this month’s pages when the date falls in the current month.'}
          </SheetDescription>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <Field label="Name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Coffee, salary, rent"
                maxLength={80}
                required
              />
            </Field>

            <Field label="Amount">
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                  R
                </span>
                <Input
                  className="pl-7"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="90"
                  required
                />
              </div>
            </Field>

            <Field label="Type">
              <TypeToggle
                value={type}
                onChange={handleTypeChange}
                disabled={lockType}
              />
            </Field>

            <Field
              label="Account"
              hint={
                missingAccounts
                  ? 'Add an account on the Accounts page first.'
                  : undefined
              }
            >
              <NativeSelect
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                disabled={missingAccounts}
                required
              >
                {missingAccounts ? (
                  <option value="">No accounts yet</option>
                ) : (
                  catalogs.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))
                )}
              </NativeSelect>
            </Field>

            <Field
              label="Category"
              hint={
                missingCategories
                  ? `Add a ${type} category on the Categories page first.`
                  : undefined
              }
            >
              <NativeSelect
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={missingCategories}
                required
              >
                {missingCategories ? (
                  <option value="">No matching categories</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </NativeSelect>
            </Field>

            <Field label="Date">
              <Input
                type="date"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                required
              />
            </Field>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <SheetFooter>
            {isEditing ? (
              confirmDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={handleDelete}
                >
                  Delete permanently
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              )
            ) : null}
            <Button
              type="submit"
              disabled={pending || missingAccounts || missingCategories}
            >
              {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Add entry'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
