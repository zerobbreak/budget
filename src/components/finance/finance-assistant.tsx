import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createAccount,
  createCategory,
  createTransaction,
} from '@/finance.functions'
import { toggleFavoriteStock } from '@/stocks.functions'
import { useFinanceAction } from '@/hooks/use-finance-action'
import { CURATED_STOCKS } from '@/lib/stocks-data'
import { APP_CURRENCY, type NavItem } from '@/lib/finance-data'
import {
  applyPillToDraft,
  type AssistantAction,
  type AssistantContext,
  type AssistantDraft,
  type AssistantMessage,
  type AssistantPill,
  type AssistantResponse,
} from '@/lib/assistant-data'
import { cn } from '@/lib/utils'

const financeRoute = getRouteApi('/_finance')

type ChatEntry = AssistantMessage & {
  pills?: AssistantPill[]
}

function todayInput() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function AssistantPillButton({
  pill,
  disabled,
  onClick,
}: {
  pill: AssistantPill
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'sketch-badge inline-flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 font-hand text-xs font-medium text-foreground transition-colors',
        'hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {pill.label}
    </button>
  )
}

export function FinanceAssistant() {
  const navigate = useNavigate()
  const router = useRouter()
  const { run, pending } = useFinanceAction()
  const createTransactionFn = useServerFn(createTransaction)
  const createAccountFn = useServerFn(createAccount)
  const createCategoryFn = useServerFn(createCategory)
  const toggleFavoriteFn = useServerFn(toggleFavoriteStock)

  const { catalogs, overview } = financeRoute.useLoaderData()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<AssistantDraft | null>(null)
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(
    null,
  )
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      role: 'assistant',
      content:
        'Hi — I can add income or expenses, create accounts, favorite stocks, or jump to any section. What would you like to do?',
    },
  ])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const context: AssistantContext = {
    today: todayInput(),
    currency: APP_CURRENCY,
    summary: overview.summary,
    catalogs,
    stocks: CURATED_STOCKS.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
    })),
    recentTransactions: overview.transactions.slice(0, 8).map((transaction) => ({
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account,
    })),
  }

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
      inputRef.current?.focus()
    }
  }, [open, messages, loading])

  const executeAction = useCallback(
    async (action: AssistantAction) => {
      switch (action.type) {
        case 'create_transaction':
          await run(() =>
            createTransactionFn({
              data: {
                name: action.name,
                amount: action.amount,
                type: action.ledgerType,
                accountId: action.accountId,
                categoryId: action.categoryId,
                occurredAt: action.occurredAt,
              },
            }),
          )
          break
        case 'create_account':
          await run(() => createAccountFn({ data: { name: action.name } }))
          break
        case 'create_category':
          await run(() =>
            createCategoryFn({
              data: { name: action.name, type: action.ledgerType },
            }),
          )
          break
        case 'navigate':
          await navigate({ to: action.path })
          break
        case 'toggle_stock_favorite':
          await run(() =>
            toggleFavoriteFn({ data: { symbol: action.symbol } }),
          )
          break
      }
    },
    [
      createAccountFn,
      createCategoryFn,
      createTransactionFn,
      navigate,
      run,
      toggleFavoriteFn,
    ],
  )

  const sendMessage = useCallback(
    async (message: string, nextDraft?: AssistantDraft | null) => {
      const trimmed = message.trim()
      if (!trimmed || loading) {
        return
      }

      setLoading(true)
      setMessages((current) => [...current, { role: 'user', content: trimmed }])

      try {
        const history = messages.map(({ role, content }) => ({ role, content }))
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history,
            draft: nextDraft ?? draft,
            context,
          }),
        })

        if (!response.ok) {
          throw new Error(`Assistant request failed (${response.status}).`)
        }

        const result = (await response.json()) as AssistantResponse
        setDraft(result.draft)
        setPendingAction(result.action)
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content: result.reply,
            pills: result.pills,
          },
        ])
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content:
              error instanceof Error
                ? `Something went wrong: ${error.message}`
                : 'Something went wrong. Try again in a moment.',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [context, draft, loading, messages],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = input
    setInput('')
    await sendMessage(value)
  }

  async function handlePillClick(pill: AssistantPill) {
    if (loading || pending) {
      return
    }

    if (pill.kind === 'navigate' && typeof pill.payload.path === 'string') {
      await navigate({ to: pill.payload.path as NavItem['to'] })
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `Opened ${pill.label}.`,
        },
      ])
      return
    }

    if (pill.kind === 'confirm' && pendingAction) {
      try {
        await executeAction(pendingAction)
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content: 'Done — your budget has been updated.',
          },
        ])
        setDraft(null)
        setPendingAction(null)
        await router.invalidate({ sync: true })
      } catch {
        // useFinanceAction surfaces errors via thrown promise
      }
      return
    }

    if (pill.kind === 'stock' && typeof pill.payload.symbol === 'string') {
      await sendMessage(`Favorite ${pill.label}`, draft)
      return
    }

    const nextDraft = applyPillToDraft(draft ?? undefined, pill)
    setDraft(nextDraft)
    await sendMessage(`Selected ${pill.label}`, nextDraft)
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3',
          open && 'pointer-events-auto',
        )}
      >
        {open ? (
          <div className="sketch-panel flex w-[min(100vw-3rem,22rem)] flex-col overflow-hidden bg-card shadow-lg sm:w-96">
            <header className="flex items-center justify-between border-b border-dashed border-[var(--sketch-ink)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="sketch-icon size-4 text-primary" />
                <h2 className="font-hand text-lg font-medium">Assistant</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X className="sketch-icon size-4" />
              </Button>
            </header>

            <div
              ref={scrollRef}
              className="flex max-h-80 flex-col gap-3 overflow-y-auto px-4 py-3"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    'max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    message.role === 'assistant'
                      ? 'self-start bg-muted text-foreground'
                      : 'self-end bg-primary/15 text-foreground',
                  )}
                >
                  <p>{message.content}</p>
                  {message.pills && message.pills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.pills.map((pill) => (
                        <AssistantPillButton
                          key={pill.id}
                          pill={pill}
                          disabled={loading || pending}
                          onClick={() => void handlePillClick(pill)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {loading ? (
                <p className="self-start text-sm text-muted-foreground">
                  Thinking…
                </p>
              ) : null}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-dashed border-[var(--sketch-ink)] px-3 py-3"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask or command…"
                disabled={loading || pending}
                className="h-9 flex-1"
              />
              <Button
                type="submit"
                size="icon-sm"
                disabled={loading || pending || input.trim().length === 0}
                aria-label="Send message"
              >
                <Send className="sketch-icon size-4" />
              </Button>
            </form>
          </div>
        ) : null}

        <Button
          type="button"
          size="icon-lg"
          className={cn(
            'sketch-tilt-a size-14 rounded-full shadow-lg transition-transform hover:scale-105',
            open && 'ring-2 ring-primary/40',
          )}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close assistant' : 'Open assistant'}
          aria-expanded={open}
        >
          {open ? (
            <X className="sketch-icon size-5" />
          ) : (
            <MessageCircle className="sketch-icon size-5" />
          )}
        </Button>
      </div>
    </>
  )
}
