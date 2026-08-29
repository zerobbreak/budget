import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

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
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="sketch-underline font-hand text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-end gap-4">
        {typeof totalBalance === 'number' ? (
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
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
    <Button type="button" onClick={onClick}>
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
      <CardContent className="space-y-2 px-5 py-4">
        <p className="font-hand text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
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
    <div className="flex flex-1 flex-col gap-8 p-8 md:p-10">{children}</div>
  )
}
