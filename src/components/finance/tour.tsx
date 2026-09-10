import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type TourStep = {
  id: string
  to: '/' | '/accounts' | '/categories' | '/income' | '/guide'
  targetId: string
  requiresSidebar?: boolean
  title: string
  body: string
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    to: '/',
    targetId: 'tour-sidebar-nav',
    requiresSidebar: true,
    title: 'Welcome to Nocturne',
    body: "Seven pages live in this sidebar — we'll walk through the ones that matter first. Everything you see here is private to your login, and every page shows the current calendar month only.",
  },
  {
    id: 'accounts',
    to: '/accounts',
    targetId: 'tour-add-account',
    title: 'Add an account',
    body: 'Start here. An account is simply where money lives — a cheque account, cash, savings. Press Next when you’re ready to add categories.',
  },
  {
    id: 'categories',
    to: '/categories',
    targetId: 'tour-add-category',
    title: 'Label income and expenses',
    body: 'Categories carry a type — income or expense — that locks once a transaction uses it, so plan your split before dozens of entries ride on it.',
  },
  {
    id: 'entry',
    to: '/',
    targetId: 'tour-add-entry',
    title: 'Log your first entry',
    body: 'With an account and a category ready, Add entry takes a name, a whole-Rand amount, and a date. It only shows up here while that date falls in the current month.',
  },
  {
    id: 'assistant',
    to: '/',
    targetId: 'tour-assistant-button',
    title: 'Or just type it',
    body: 'The chat bubble in the corner understands plain sentences like “add 500 groceries expense” — it asks for whatever’s missing with tappable pills, then confirms before it saves anything.',
  },
  {
    id: 'income-extras',
    to: '/income',
    targetId: 'tour-income-extras',
    title: 'Growth projection & AI insights',
    body: 'The Income page projects your monthly surplus forward against a chosen benchmark, and narrates your numbers in plain language — both work even without an API key configured.',
  },
  {
    id: 'guide-link',
    to: '/',
    targetId: 'tour-guide-link',
    requiresSidebar: true,
    title: 'Come back anytime',
    body: 'This tour and the full written guide both live behind Guide in the sidebar — restart it whenever you like.',
  },
]

type TourContextValue = {
  isActive: boolean
  start: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

function storageKey(userId: string) {
  return `nocturne:tour-seen:${userId}`
}

export function TourProvider({
  userId,
  isNewAccount,
  children,
}: {
  userId: string
  isNewAccount: boolean
  children: ReactNode
}) {
  const [isActive, setIsActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const autoStartChecked = useRef(false)
  const navigate = useNavigate()

  const start = () => {
    setStepIndex(0)
    setIsActive(true)
    void navigate({ to: STEPS[0].to })
  }

  const finish = () => {
    setIsActive(false)
    try {
      window.localStorage.setItem(storageKey(userId), '1')
    } catch {
      // Private browsing or storage disabled — the tour just won't self-suppress next time.
    }
  }

  useEffect(() => {
    if (autoStartChecked.current) {
      return
    }
    autoStartChecked.current = true

    let seen = false
    try {
      seen = window.localStorage.getItem(storageKey(userId)) === '1'
    } catch {
      seen = false
    }

    if (!seen && isNewAccount) {
      const timer = window.setTimeout(start, 600)
      return () => window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isNewAccount])

  const value = useMemo<TourContextValue>(() => ({ isActive, start }), [isActive])

  return (
    <TourContext value={value}>
      {children}
      {isActive ? (
        <TourRunner
          step={STEPS[stepIndex]}
          stepNumber={stepIndex + 1}
          totalSteps={STEPS.length}
          onNext={() =>
            stepIndex + 1 >= STEPS.length ? finish() : setStepIndex((i) => i + 1)
          }
          onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
          onSkip={finish}
          isFirst={stepIndex === 0}
          isLast={stepIndex === STEPS.length - 1}
        />
      ) : null}
    </TourContext>
  )
}

export function useTour() {
  const value = use(TourContext)

  if (!value) {
    throw new Error('useTour must be used inside TourProvider.')
  }

  return value
}

function useElementRect(targetId: string) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    let frame = 0
    let attempts = 0
    let cancelled = false

    function measure() {
      if (cancelled) {
        return
      }

      const el = document.getElementById(targetId)

      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setRect(el.getBoundingClientRect())
        return
      }

      if (attempts < 150) {
        attempts += 1
        frame = requestAnimationFrame(measure)
      } else {
        setRect(null)
      }
    }

    setRect(null)
    measure()

    function refresh() {
      const el = document.getElementById(targetId)
      if (el) {
        setRect(el.getBoundingClientRect())
      }
    }

    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
    }
  }, [targetId])

  return rect
}

function TourRunner({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  isFirst,
  isLast,
}: {
  step: TourStep
  stepNumber: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { isMobile, setOpenMobile } = useSidebar()

  useEffect(() => {
    if (pathname !== step.to) {
      void navigate({ to: step.to })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.to])

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(!!step.requiresSidebar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, isMobile])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onSkip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rect = useElementRect(step.targetId)
  const placement =
    rect && rect.top > window.innerHeight * 0.55 ? 'top' : 'bottom'

  const tooltipWidth = 340
  const margin = 16
  const left = rect
    ? Math.min(
        Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2),
        window.innerWidth - tooltipWidth - margin,
      )
    : undefined

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-2xl border-2 border-primary transition-all duration-300 ease-out"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(15, 10, 30, 0.66)',
          }}
        />
      ) : (
        <div
          className="fixed inset-0"
          style={{ background: 'rgba(15, 10, 30, 0.66)' }}
        />
      )}

      {/* Blocks interaction with the live app while the tour is active. */}
      <div className="fixed inset-0" onClick={(event) => event.stopPropagation()} />

      <div
        className="sketch-panel fixed z-[91] flex flex-col gap-3 bg-card p-5 shadow-2xl"
        style={
          rect
            ? {
                width: tooltipWidth,
                maxWidth: 'calc(100vw - 2rem)',
                left: left,
                ...(placement === 'bottom'
                  ? { top: rect.bottom + margin }
                  : { bottom: window.innerHeight - rect.top + margin }),
              }
            : {
                width: tooltipWidth,
                maxWidth: 'calc(100vw - 2rem)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
        }
      >
        <div className="flex items-center justify-between">
          <span className="font-hand text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Step {stepNumber} of {totalSteps}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Skip tour
          </button>
        </div>

        <h2 className="font-hand text-xl font-medium">{step.title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  i === stepNumber - 1 ? 'bg-primary' : 'bg-border',
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst ? (
              <Button type="button" variant="outline" size="sm" onClick={onBack}>
                Back
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={onNext}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
