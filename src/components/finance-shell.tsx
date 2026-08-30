import { Outlet, getRouteApi } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { FinanceEditor } from '@/components/finance/finance-editor'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { formatCurrency } from '@/lib/finance-data'

const financeRoute = getRouteApi('/_finance')

function MobileHeader({ cash }: { cash: number }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b-[1.75px] border-dashed border-[var(--sketch-ink)] bg-background/90 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md md:hidden">
      <SidebarTrigger className="size-10 shrink-0" />
      <p className="min-w-0 flex-1 truncate font-hand text-base font-semibold tracking-tight">
        Nocturne
      </p>
      <p className="shrink-0 font-hand text-sm font-semibold tabular-nums">
        {formatCurrency(cash)}
      </p>
    </header>
  )
}

export function FinanceShell() {
  const { catalogs, netWorth } = financeRoute.useLoaderData()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <MobileHeader cash={netWorth.total} />
        <FinanceEditor catalogs={catalogs}>
          <Outlet />
        </FinanceEditor>
      </SidebarInset>
    </SidebarProvider>
  )
}
