import { ExpenseDonutChart } from '@/components/finance/expense-charts'
import { useFinanceEditor } from '@/components/finance/finance-editor'
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
import {
  AddRecordButton,
  FinancePage,
  PageHeader,
  SectionLabel,
} from '@/components/finance/page-shell'
import type { CategoriesData } from '@/finance.functions'
import { formatCurrency } from '@/lib/finance-data'
import { aggregateByCategory } from '@/lib/finance-charts'

export function CategoriesDashboard({ data }: { data: CategoriesData }) {
  const editor = useFinanceEditor()
  const expenseCategories = aggregateByCategory(
    data.categories
      .filter((category) => category.type === 'expense')
      .map((category) => ({ name: category.name, total: category.total })),
  )
  const expenseTotal = expenseCategories.reduce(
    (sum, category) => sum + category.total,
    0,
  )

  return (
    <FinancePage>
      <PageHeader
        title="Categories"
        action={
          <AddRecordButton onClick={() => editor.addCategory()}>
            Add category
          </AddRecordButton>
        }
      />

      <section className="space-y-4">
        <SectionLabel>Expense breakdown</SectionLabel>
        <ExpenseDonutChart
          items={expenseCategories}
          total={expenseTotal}
          showTopSpender
        />
      </section>

      <section className="space-y-4">
        <SectionLabel>Spending by category</SectionLabel>
        <div className="space-y-2 md:hidden">
          {data.categories.length === 0 ? (
            <Card>
              <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
                No categories yet. Add one before logging entries.
              </CardContent>
            </Card>
          ) : (
            data.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => editor.editCategory(category)}
                className="sketch-panel flex w-full items-center justify-between gap-3 bg-card px-4 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {category.name}
                  </span>
                  <span className="mt-1 inline-flex">
                    {category.type === 'income' ? (
                      <Badge>Income</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-primary/35 text-foreground hover:bg-transparent"
                      >
                        Expense
                      </Badge>
                    )}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {category.type === 'income' ? '+' : '-'}
                  {formatCurrency(category.total)}
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
                    Category
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Type
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categories.length === 0 ? (
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No categories yet. Add one before logging entries.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.categories.map((category) => (
                    <TableRow
                      key={category.id}
                      className="cursor-pointer border-border/60 hover:bg-muted/20"
                      onClick={() => editor.editCategory(category)}
                    >
                      <TableCell className="px-4 py-3.5 font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        {category.type === 'income' ? (
                          <Badge>Income</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-primary/35 text-foreground hover:bg-transparent"
                          >
                            Expense
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        <span className="font-medium text-foreground tabular-nums">
                          {category.type === 'income' ? '+' : '-'}
                          {formatCurrency(category.total)}
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
