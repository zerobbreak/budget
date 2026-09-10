import {
  AddRecordButton,
  FinancePage,
  PageHeader,
  SectionLabel,
  SummaryCard,
} from '@/components/finance/page-shell'
import { TransactionsTable } from '@/components/finance/transactions-table'
import { useFinanceEditor } from '@/components/finance/finance-editor'
import type { OverviewData } from '@/finance.functions'

export function OverviewDashboard({
  data,
  totalBalance,
}: {
  data: OverviewData
  totalBalance: number
}) {
  const { summary, transactions } = data
  const editor = useFinanceEditor()

  return (
    <FinancePage>
      <PageHeader
        title="Overview"
        totalBalance={totalBalance}
        action={
          <AddRecordButton id="tour-add-entry" onClick={() => editor.addTransaction()}>
            Add entry
          </AddRecordButton>
        }
      />

      <section className="space-y-3">
        <SectionLabel>Total balance</SectionLabel>
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            label="Income"
            value={summary.income}
            positive
            tilt="a"
          />
          <SummaryCard
            label="Expenses"
            value={summary.expenses}
            negative
            tilt="b"
          />
          <SummaryCard label="Net" value={summary.net} positive tilt="a" />
        </div>
      </section>

      <TransactionsTable
        transactions={transactions}
        onSelect={editor.editTransaction}
      />
    </FinancePage>
  )
}
