import { Outlet, getRouteApi } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { FinanceEditor } from '@/components/finance/finance-editor'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const financeRoute = getRouteApi('/_finance')

export function FinanceShell() {
  const { catalogs } = financeRoute.useLoaderData()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <FinanceEditor catalogs={catalogs}>
          <Outlet />
        </FinanceEditor>
      </SidebarInset>
    </SidebarProvider>
  )
}
