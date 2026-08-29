import { useFinanceEditor } from '@/components/finance/finance-editor'
import {
  AddRecordButton,
  FinancePage,
  PageHeader,
  SectionLabel,
  SummaryCard,
} from '@/components/finance/page-shell'
import { SimpleAmountTable } from '@/components/finance/transactions-table'
import type { NetWorthData } from '@/finance.functions'

export function NetWorthDashboard({ data }: { data: NetWorthData }) {
  const editor = useFinanceEditor()

  return (
    <FinancePage>
      <PageHeader
        title="Net worth"
        action={
          <AddRecordButton onClick={editor.addAccount}>
            Add account
          </AddRecordButton>
        }
      />

      <section className="space-y-3">
        <SectionLabel>Total net worth</SectionLabel>
        <div className="grid gap-3 md:grid-cols-1">
          <SummaryCard
            label="Net worth"
            value={Math.abs(data.total)}
            positive={data.total >= 0}
            negative={data.total < 0}
          />
        </div>
      </section>

      <SimpleAmountTable
        title="Accounts"
        rows={data.accounts.map((account) => ({
          id: account.id,
          name: account.name,
          amount: Math.abs(account.balance),
          positive: account.balance >= 0,
        }))}
        emptyMessage="No accounts yet."
        valueLabel="Balance"
        onSelect={(id) => {
          const account = data.accounts.find((item) => item.id === id)
          if (account) {
            editor.editAccount(account)
          }
        }}
      />
    </FinancePage>
  )
}
