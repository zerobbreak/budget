import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export const financeSheetClassName =
  'w-full sm:max-w-md max-sm:!inset-x-0 max-sm:!top-auto max-sm:!h-auto max-sm:max-h-[92dvh] max-sm:!w-full max-sm:rounded-t-[1.5rem] max-sm:border-t max-sm:pb-[env(safe-area-inset-bottom)]'

export function PageHeader({
  title,
  subtitle = 'This month',
  action,
  totalBalance,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  totalBalance?: number
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="sketch-underline font-hand text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4">
        {typeof totalBalance === 'number' ? (
          <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {formatCurrency(totalBalance)}
          </p>
        ) : null}
        {action}
      </div>
    </header>
  )
}

export function AddRecordButton({
  children,
  onClick,
}: {
  children: string
  onClick: () => void
}) {
  return (
    <Button type="button" className="w-full sm:w-auto" onClick={onClick}>
      <Plus className="sketch-icon" />
      {children}
    </Button>
  )
}

export function SummaryCard({
  label,
  value,
  negative,
  tilt,
}: {
  label: string
  value: number
  positive?: boolean
  negative?: boolean
  tilt?: 'a' | 'b'
}) {
  const prefix = negative ? '-' : '+'

  return (
    <Card
      className={cn(
        tilt === 'a' && 'sketch-tilt-a',
        tilt === 'b' && 'sketch-tilt-b',
      )}
    >
      <CardContent className="space-y-2 px-4 py-4 sm:px-5">
        <p className="font-hand text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
          {prefix}
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  )
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-hand text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
      {children}
    </p>
  )
}

export function FinancePage({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:p-6 md:gap-8 md:p-10 md:pb-10">
      {children}
    </div>
  )
}
