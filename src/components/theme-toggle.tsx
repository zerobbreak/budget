import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

const options = [
  { value: 'light', label: 'Day', icon: Sun },
  { value: 'dark', label: 'Night', icon: Moon },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="sketch-badge grid grid-cols-2 border-(--sketch-ink) border-[1.75px] bg-sidebar-accent/40 p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-7 items-center justify-center gap-1 rounded-[10px_6px_9px_5px/6px_9px_5px_10px] font-hand text-xs font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-muted-foreground hover:text-sidebar-foreground',
            )}
          >
            <Icon className="sketch-icon size-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
