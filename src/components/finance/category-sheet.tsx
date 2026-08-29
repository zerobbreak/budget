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
import { Field, TypeToggle } from '@/components/finance/form-field'
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryRow,
  type LedgerType,
} from '@/finance.functions'
import { useFinanceAction } from '@/hooks/use-finance-action'

export function CategorySheet({
  open,
  onOpenChange,
  category,
  defaultType = 'expense',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryRow
  defaultType?: LedgerType
}) {
  const isEditing = Boolean(category)
  const typeLocked = Boolean(category && category.total > 0)
  const { run, pending, error, setError } = useFinanceAction()
  const createCategoryFn = useServerFn(createCategory)
  const updateCategoryFn = useServerFn(updateCategory)
  const deleteCategoryFn = useServerFn(deleteCategory)
  const [name, setName] = useState('')
  const [type, setType] = useState<LedgerType>(defaultType)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setError(null)
    setConfirmDelete(false)
    setName(category?.name ?? '')
    setType(category?.type ?? defaultType)
  }, [open, category, defaultType, setError])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    try {
      await run(async () => {
        if (category) {
          await updateCategoryFn({
            data: { id: category.id, name, type },
          })
        } else {
          await createCategoryFn({ data: { name, type } })
        }
      })
      onOpenChange(false)
    } catch {
      // Error is shown in the sheet.
    }
  }

  async function handleDelete() {
    if (!category) {
      return
    }

    try {
      await run(() => deleteCategoryFn({ data: { id: category.id } }))
      onOpenChange(false)
    } catch {
      // Error is shown in the sheet.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit category' : 'New category'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Categories group income and spending. Type is locked once entries exist.'
              : 'Use a category for each kind of income or spend, then pick it on an entry.'}
          </SheetDescription>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <Field label="Name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Food"
                maxLength={80}
                required
              />
            </Field>

            <Field
              label="Type"
              hint={
                typeLocked
                  ? 'Type cannot change while this category still has transactions.'
                  : undefined
              }
            >
              <TypeToggle
                value={type}
                onChange={setType}
                disabled={typeLocked}
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
                  Delete category
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
              {pending
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Add category'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
