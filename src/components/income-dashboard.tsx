import {
  AddRecordButton,
  FinancePage,
  PageHeader,
  SectionLabel,
  SummaryCard,
} from '@/components/finance/page-shell'
import { InsightsPanel } from '@/components/finance/insights-panel'
import { ProjectionCard } from '@/components/finance/projection-card'
import { TransactionsTable } from '@/components/finance/transactions-table'
import { useFinanceEditor } from '@/components/finance/finance-editor'
import type { CategoryRow, IncomeData } from '@/finance.types'
import type { ProjectionData } from '@/projection.types'

export function IncomeDashboard({
  data,
  expensesTotal,
  categories,
  projection,
}: {
  data: IncomeData
  expensesTotal: number
  categories: CategoryRow[]
  projection: ProjectionData
}) {
  const editor = useFinanceEditor()

  return (
    <FinancePage>
      <PageHeader
        title="Income"
        action={
          <AddRecordButton
            onClick={() =>
              editor.addTransaction({ type: 'income', lockType: true })
            }
          >
            Add income
          </AddRecordButton>
        }
      />

      <section className="space-y-3">
        <SectionLabel>Total income</SectionLabel>
        <div className="grid gap-3 md:grid-cols-1">
          <SummaryCard label="Income" value={data.total} positive />
        </div>
      </section>

      <ProjectionCard data={projection} />

      <InsightsPanel
        income={data.total}
        expenses={expensesTotal}
        surplus={projection.surplus}
        categories={categories}
        projection={projection}
      />

      <TransactionsTable
        title="Income transactions"
        transactions={data.transactions}
        emptyMessage="No income recorded this month."
        showCategory={false}
        onSelect={editor.editTransaction}
      />
    </FinancePage>
  )
}
