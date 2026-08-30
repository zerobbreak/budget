import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

export function NativeSelect({
  className,
  children,
  ...props
}: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors md:h-8 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function TypeToggle({
  value,
  onChange,
  disabled,
}: {
  value: 'income' | 'expense'
  onChange: (value: 'income' | 'expense') => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-input p-1">
      {(['income', 'expense'] as const).map((option) => {
        const selected = value === option

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'h-9 rounded-md text-xs font-medium tracking-[0.12em] uppercase transition-colors md:h-7',
              selected
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
