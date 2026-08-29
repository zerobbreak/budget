import { ExpenseBarChart, ExpenseDonutChart, ExpenseTopSpender } from '@/components/finance/expense-charts'
import { useFinanceEditor } from '@/components/finance/finance-editor'
import {
  AddRecordButton,
  FinancePage,
  PageHeader,
  SectionLabel,
  SummaryCard,
} from '@/components/finance/page-shell'
import { TransactionsTable } from '@/components/finance/transactions-table'
import type { ExpensesData } from '@/finance.functions'
import { aggregateTransactionsByCategory } from '@/lib/finance-charts'

export function ExpensesDashboard({ data }: { data: ExpensesData }) {
  const categoryTotals = aggregateTransactionsByCategory(data.transactions)
  const editor = useFinanceEditor()

  return (
    <FinancePage>
      <PageHeader
        title="Expenses"
        action={
          <AddRecordButton
            onClick={() =>
              editor.addTransaction({ type: 'expense', lockType: true })
            }
          >
            Add expense
          </AddRecordButton>
        }
      />

      <section className="space-y-3">
        <SectionLabel>Total expenses</SectionLabel>
        <div className="grid gap-3 md:grid-cols-1">
          <SummaryCard label="Expenses" value={data.total} negative />
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel>What costs the most</SectionLabel>
        <ExpenseTopSpender items={categoryTotals} total={data.total} />
        <div className="grid gap-4 xl:grid-cols-2">
          <ExpenseBarChart items={categoryTotals} />
          <ExpenseDonutChart items={categoryTotals} total={data.total} />
        </div>
      </section>

      <TransactionsTable
        title="Expense transactions"
        transactions={data.transactions}
        emptyMessage="No expenses recorded this month."
        showCategory={false}
        onSelect={editor.editTransaction}
      />
    </FinancePage>
  )
}
