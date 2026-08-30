import { ArrowDown, ArrowUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/finance-data'
import type { TransactionItem } from '@/finance.functions'
import { cn } from '@/lib/utils'

function CategoryBadge({ transaction }: { transaction: TransactionItem }) {
  if (transaction.type === 'income') {
    return <Badge>{transaction.category}</Badge>
  }

  return (
    <Badge
      variant="outline"
      className="border-primary/35 text-foreground hover:bg-transparent"
    >
      {transaction.category}
    </Badge>
  )
}

function AmountCell({ transaction }: { transaction: TransactionItem }) {
  const isIncome = transaction.type === 'income'
  const Icon = isIncome ? ArrowUp : ArrowDown

  return (
    <div className="flex items-center justify-end gap-1 font-medium text-foreground tabular-nums">
      <Icon className="sketch-icon size-3.5" />
      <span>{formatCurrency(transaction.amount)}</span>
    </div>
  )
}

type TransactionsTableProps = {
  title?: string
  transactions: TransactionItem[]
  emptyMessage?: string
  showAccount?: boolean
  showCategory?: boolean
  onSelect?: (transaction: TransactionItem) => void
}

function TransactionCard({
  transaction,
  showAccount,
  showCategory,
  onSelect,
}: {
  transaction: TransactionItem
  showAccount: boolean
  showCategory: boolean
  onSelect?: (transaction: TransactionItem) => void
}) {
  const meta = [
    showAccount ? transaction.account : null,
    showCategory ? transaction.category : null,
  ].filter(Boolean)

  return (
    <button
      type="button"
      disabled={!onSelect}
      onClick={onSelect ? () => onSelect(transaction) : undefined}
      className={cn(
        'sketch-panel flex w-full items-start justify-between gap-3 bg-card px-4 py-3 text-left',
        onSelect && 'cursor-pointer',
        !onSelect && 'cursor-default',
      )}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{transaction.name}</span>
        {meta.length > 0 ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {meta.join(' · ')}
          </span>
        ) : null}
      </span>
      <AmountCell transaction={transaction} />
    </button>
  )
}

export function TransactionsTable({
  title = 'Recent transactions',
  transactions,
  emptyMessage = 'No transactions this month.',
  showAccount = true,
  showCategory = true,
  onSelect,
}: TransactionsTableProps) {
  const columnCount =
    2 + Number(showAccount) + Number(showCategory)

  return (
    <section className="space-y-4">
      <h2 className="font-hand text-xl font-medium">{title}</h2>

      <div className="space-y-2 md:hidden">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              showAccount={showAccount}
              showCategory={showCategory}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      <Card className="hidden overflow-hidden py-0 md:block">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="sketch-divider border-border/60 hover:bg-transparent">
                <TableHead className="h-11 px-4 font-hand text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  Name
                </TableHead>
                {showAccount ? (
                  <TableHead className="h-11 px-4 font-hand text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                    Account
                  </TableHead>
                ) : null}
                {showCategory ? (
                  <TableHead className="h-11 px-4 font-hand text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                    Category
                  </TableHead>
                ) : null}
                <TableHead className="h-11 px-4 text-right font-hand text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell
                    colSpan={columnCount}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className={cn(
                      'sketch-divider border-border/60 hover:bg-muted/20',
                      onSelect && 'cursor-pointer',
                    )}
                    onClick={
                      onSelect ? () => onSelect(transaction) : undefined
                    }
                  >
                    <TableCell className="px-4 py-3.5 font-medium">
                      {transaction.name}
                    </TableCell>
                    {showAccount ? (
                      <TableCell className="px-4 py-3.5 text-muted-foreground">
                        {transaction.account}
                      </TableCell>
                    ) : null}
                    {showCategory ? (
                      <TableCell className="px-4 py-3.5">
                        <CategoryBadge transaction={transaction} />
                      </TableCell>
                    ) : null}
                    <TableCell className="px-4 py-3.5">
                      <AmountCell transaction={transaction} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}

export function SimpleAmountTable({
  title,
  rows,
  emptyMessage,
  valueLabel = 'Amount',
  onSelect,
}: {
  title: string
  rows: Array<{
    id: number | string
    name: string
    amount: number
    positive?: boolean
  }>
  emptyMessage: string
  valueLabel?: string
  onSelect?: (id: number | string) => void
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-hand text-xl font-medium">{title}</h2>

      <div className="space-y-2 md:hidden">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          rows.map((row) => (
            <button
              key={row.id}
              type="button"
              disabled={!onSelect}
              onClick={onSelect ? () => onSelect(row.id) : undefined}
              className={cn(
                'sketch-panel flex w-full items-center justify-between gap-3 bg-card px-4 py-3 text-left',
                onSelect && 'cursor-pointer',
                !onSelect && 'cursor-default',
              )}
            >
              <span className="min-w-0 truncate font-medium">{row.name}</span>
              <span className="shrink-0 font-medium text-foreground tabular-nums">
                {row.positive ? '+' : '-'}
                {formatCurrency(row.amount)}
              </span>
            </button>
          ))
        )}
      </div>

      <Card className="hidden overflow-hidden py-0 md:block">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="sketch-divider border-border/60 hover:bg-transparent">
                <TableHead className="h-11 px-4 font-hand text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  Name
                </TableHead>
                <TableHead className="h-11 px-4 text-right font-hand text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  {valueLabel}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell
                    colSpan={2}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'sketch-divider border-border/60 hover:bg-muted/20',
                      onSelect && 'cursor-pointer',
                    )}
                    onClick={onSelect ? () => onSelect(row.id) : undefined}
                  >
                    <TableCell className="px-4 py-3.5 font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <span className="font-medium text-foreground tabular-nums">
                        {row.positive ? '+' : '-'}
                        {formatCurrency(row.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
