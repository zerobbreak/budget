import { useEffect, useState, type FormEvent } from 'react'
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
import { Field } from '@/components/finance/form-field'
import {
  createAccount,
  deleteAccount,
  updateAccount,
  type AccountRow,
} from '@/finance.functions'
import { useFinanceAction } from '@/hooks/use-finance-action'

export function AccountSheet({
  open,
  onOpenChange,
  account,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: AccountRow
}) {
  const isEditing = Boolean(account)
  const { run, pending, error, setError } = useFinanceAction()
  const createAccountFn = useServerFn(createAccount)
  const updateAccountFn = useServerFn(updateAccount)
  const deleteAccountFn = useServerFn(deleteAccount)
  const [name, setName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setError(null)
    setConfirmDelete(false)
    setName(account?.name ?? '')
  }, [open, account, setError])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    try {
      await run(async () => {
        if (account) {
          await updateAccountFn({ data: { id: account.id, name } })
        } else {
          await createAccountFn({ data: { name } })
        }
      })
      onOpenChange(false)
    } catch {
      // Error is shown in the sheet.
    }
  }

  async function handleDelete() {
    if (!account) {
      return
    }

    try {
      await run(() => deleteAccountFn({ data: { id: account.id } }))
      onOpenChange(false)
    } catch {
      // Error is shown in the sheet.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit account' : 'New account'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Renaming keeps the same transactions. Deleting also removes those entries.'
              : 'Accounts are the pots money moves through — cheque, savings, cash.'}
          </SheetDescription>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <Field label="Name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Cheque"
                maxLength={80}
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
                  Delete account and entries
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
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Add account'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
