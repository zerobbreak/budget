import {
  BookOpen,
  CalendarClock,
  MessageCircle,
  Sparkles,
  Wand2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FinancePage, PageHeader, SectionLabel } from '@/components/finance/page-shell'
import { useTour } from '@/components/finance/tour'
import { navItems } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

const PAGE_NOTES: Record<string, string> = {
  overview: "This month's income, expenses and net, plus the full ledger of every entry.",
  income: 'Just the income side, plus the growth projection card and AI insights.',
  expenses: 'Top spender, a bar chart and a donut chart broken down by category.',
  accounts: 'In / out / balance per account for the month. Tap a row to rename or delete it.',
  categories: "Expense breakdown donut plus every category's running total. Tap to edit.",
  'net-worth': 'Total balance across every account, added up for you.',
  stocks: 'A curated watchlist — star one to chart its price and calculate a monthly savings target toward a share goal.',
}

const STEPS = [
  {
    n: 1,
    title: 'Add an account',
    body: (
      <>
        Open <strong className="text-foreground">Accounts</strong> →{' '}
        <em>Add account</em>. This is simply where money lives — “Cash”,
        “Cheque account”, “Savings” — whatever mirrors your real wallet. You
        can rename or delete one later from the same page.
      </>
    ),
  },
  {
    n: 2,
    title: 'Add a category',
    body: (
      <>
        Open <strong className="text-foreground">Categories</strong> →{' '}
        <em>Add category</em>. Give it a name and mark it Income or Expense.
        That type <strong className="text-foreground">locks</strong> once the
        category has any transactions on it — plan the split (rent,
        groceries, salary…) before you have dozens of entries riding on it.
      </>
    ),
  },
  {
    n: 3,
    title: 'Log the entry',
    body: (
      <>
        Now <em>Add entry</em> works from anywhere — a name, a whole-Rand
        amount (no cents), the account, the category, and a date. Nocturne
        rounds to whole R currency throughout, so “R 149.99” becomes 150.
      </>
    ),
    hint: 'Grey button? The form tells you exactly which of step 1 or 2 is still missing.',
  },
]

const FAQ = [
  {
    q: "My entry isn't showing up anywhere.",
    a: "Check its date. Every page only shows the current calendar month — a backdated or future-dated entry is saved, just not visible until its month is current.",
  },
  {
    q: '"Add entry" won’t submit.',
    a: 'You need at least one account, and at least one category of the matching type (income or expense), before the form will accept anything.',
  },
  {
    q: "I can't change a category from expense to income.",
    a: 'Type locks the moment a category has a transaction against it. Create a fresh category instead and move future entries to it.',
  },
  {
    q: 'Deleting an account or category is refused.',
    a: 'It still has transactions attached. Move or delete those first, then the delete will go through.',
  },
  {
    q: 'Account balances look smaller than I expect.',
    a: "Balances and net worth are this month's movement only — income minus expenses since the 1st — not a running lifetime total.",
  },
]

export function GuideDashboard() {
  const tour = useTour()

  return (
    <FinancePage>
      <PageHeader
        title="Guide"
        subtitle="A field guide for your first session"
        action={
          <Button type="button" onClick={tour.start} className="w-full sm:w-auto">
            <Wand2 className="sketch-icon" />
            Take the interactive tour
          </Button>
        }
      />

      <section className="space-y-3">
        <SectionLabel>Before anything else</SectionLabel>
        <Card>
          <CardContent className="space-y-3 px-4 py-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
            <p>
              The moment you land on <strong className="text-foreground">Overview</strong>,
              everything you see is scoped to your login. Every account, category and
              entry you create is tied to your account on the server — nobody else who
              uses Nocturne, on any device, can read or write into your ledger, and you
              can&apos;t see theirs.
            </p>
          </CardContent>
        </Card>
        <Card className="sketch-tilt-a border-primary/30 bg-primary/5">
          <CardContent className="flex gap-3 px-4 py-4 sm:px-5">
            <CalendarClock className="sketch-icon mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-foreground">
              <strong>The rule that explains most “where did my data go”
              moments:</strong> every dashboard — Overview, Income, Expenses,
              Accounts, Net worth — shows the <em>current calendar month
              only</em>. Log something dated last month, or next month, and
              it won&apos;t appear here until that month rolls around.
              There&apos;s no all-time view yet.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionLabel>Setup order</SectionLabel>
        <p className="text-sm text-muted-foreground">
          The “Add entry” form won&apos;t let you log anything until these
          exist — it&apos;s not broken, it&apos;s waiting on you.
        </p>
        <ol className="flex flex-col gap-6 border-l-[1.75px] border-dashed border-[var(--sketch-ink)] pl-6">
          {STEPS.map((step) => (
            <li key={step.n} className="relative">
              <span className="absolute top-[-2px] left-[-37px] flex size-8 items-center justify-center rounded-full border-[1.75px] border-primary bg-card font-hand text-sm text-primary">
                {step.n}
              </span>
              <h3 className="font-hand text-lg font-medium">{step.title}</h3>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {step.body}
              </p>
              {step.hint ? (
                <span className="mt-2 inline-block rounded-[10px_5px_10px_5px/5px_10px_5px_10px] border border-dashed border-amber-600/50 bg-amber-600/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-400">
                  {step.hint}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <SectionLabel>The sidebar</SectionLabel>
        <p className="text-sm text-muted-foreground">
          Seven pages, same order as your sidebar, each with the same
          single-letter badge you&apos;ll see there.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item, index) => (
            <Card
              key={item.id}
              className={cn(index % 2 === 0 ? 'sketch-tilt-a' : 'sketch-tilt-b')}
            >
              <CardContent className="space-y-2 px-4 py-4 sm:px-5">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary font-hand text-xs text-primary-foreground">
                  {item.letter}
                </span>
                <h3 className="font-hand text-base font-medium">{item.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {PAGE_NOTES[item.id]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel>Two shortcuts worth knowing</SectionLabel>

        <Card>
          <CardContent className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="sketch-icon size-4 text-primary" />
              <h3 className="font-hand text-lg font-medium">
                The assistant, bottom right
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              A chat bubble sits in the corner of every page. Type plain
              sentences — it fills in what&apos;s missing by offering
              tap-able pills, then a final <span className="font-hand text-primary">Confirm</span> pill
              actually creates the entry. It can also jump you to a page or
              star a stock.
            </p>
            <div className="flex max-w-sm flex-col gap-2 py-1">
              <p className="max-w-[90%] self-end rounded-2xl rounded-br-sm bg-primary/15 px-3 py-2 text-sm">
                add 500 groceries expense
              </p>
              <p className="max-w-[90%] self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                Which account should this come from?
              </p>
              <div className="flex flex-wrap gap-2 self-start">
                <span className="sketch-badge rounded-full border border-border bg-card px-3 py-1 font-hand text-xs">
                  Cheque account
                </span>
                <span className="sketch-badge rounded-full border border-border bg-card px-3 py-1 font-hand text-xs">
                  Cash
                </span>
              </div>
              <p className="max-w-[90%] self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                Groceries · R 500 · Cheque account · today. Ready?
              </p>
              <span className="sketch-badge self-start rounded-full border border-border bg-card px-3 py-1 font-hand text-xs">
                Confirm
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nothing it proposes is trusted blindly — every action still
              runs through the same account-scoped checks as the forms, so
              it can&apos;t file an entry against a category it can&apos;t
              verify belongs to you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="sketch-icon size-4 text-primary" />
              <h3 className="font-hand text-lg font-medium">
                AI insights &amp; growth projection — on Income
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Projected growth</strong>{' '}
              takes this month&apos;s surplus and shows what it could become
              over 1–20 years, set aside in a savings account versus invested
              in a benchmark index — the gear icon lets you change the
              benchmark, the assumed savings rate and how often the
              benchmark refreshes.{' '}
              <strong className="text-foreground">AI insights</strong>, just
              below it, narrates your numbers in plain language. Without a
              Gemini key configured it still works — you get a clear
              template summary instead of a generated one, clearly labelled
              either way.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionLabel>Quick answers</SectionLabel>
        <Card>
          <CardContent className="divide-y divide-dashed divide-border px-4 py-1 sm:px-5">
            {FAQ.map((item) => (
              <div key={item.q} className="py-3.5">
                <p className="font-hand text-base">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <footer className="flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--sketch-ink)] pt-4 text-xs text-muted-foreground">
        <BookOpen className="sketch-icon size-3.5" />
        <span>Amounts shown in South African Rand (ZAR), rounded to the nearest R.</span>
      </footer>
    </FinancePage>
  )
}
