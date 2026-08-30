import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFinanceEditor } from '@/components/finance/finance-editor'
import {
  AddRecordButton,
  FinancePage,
  PageHeader,
  SectionLabel,
} from '@/components/finance/page-shell'
import type { AccountsData } from '@/finance.functions'
import { formatCurrency } from '@/lib/finance-data'

export function AccountsDashboard({ data }: { data: AccountsData }) {
  const editor = useFinanceEditor()

  return (
    <FinancePage>
      <PageHeader
        title="Accounts"
        action={
          <AddRecordButton onClick={editor.addAccount}>
            Add account
          </AddRecordButton>
        }
      />

      <section className="space-y-4">
        <SectionLabel>Account balances</SectionLabel>

        <div className="space-y-2 md:hidden">
          {data.accounts.length === 0 ? (
            <Card>
              <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
                No accounts yet. Add one to start logging money.
              </CardContent>
            </Card>
          ) : (
            data.accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => editor.editAccount(account)}
                className="sketch-panel flex w-full flex-col gap-2 bg-card px-4 py-3 text-left"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {account.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {account.balance >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(account.balance))}
                  </span>
                </span>
                <span className="flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
                  <span>In +{formatCurrency(account.income)}</span>
                  <span>Out -{formatCurrency(account.expenses)}</span>
                </span>
              </button>
            ))
          )}
        </div>

        <Card className="hidden overflow-hidden py-0 ring-1 ring-border/60 md:block">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="h-11 px-4 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Account
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Income
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Expenses
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.accounts.length === 0 ? (
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No accounts yet. Add one to start logging money.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.accounts.map((account) => (
                    <TableRow
                      key={account.id}
                      className="cursor-pointer border-border/60 hover:bg-muted/20"
                      onClick={() => editor.editAccount(account)}
                    >
                      <TableCell className="px-4 py-3.5 font-medium">
                        {account.name}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums">
                        +{formatCurrency(account.income)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums">
                        -{formatCurrency(account.expenses)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        <span className="font-medium text-foreground tabular-nums">
                          {account.balance >= 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(account.balance))}
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
    </FinancePage>
  )
}
