import { Link, getRouteApi, useMatchRoute } from '@tanstack/react-router'

import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { formatCurrency, navItems } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

const financeRoute = getRouteApi('/_finance')

export function AppSidebar() {
  const matchRoute = useMatchRoute()
  const { netWorth } = financeRoute.useLoaderData()

  return (
    <Sidebar
      collapsible="none"
      className="border-r-[1.75px] border-dashed border-[var(--sketch-ink)]"
    >
      <SidebarHeader className="px-4 py-6">
        <p className="sketch-underline font-hand text-lg font-semibold tracking-tight text-sidebar-foreground">
          Nocturne Finance
        </p>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = !!matchRoute({
                  to: item.to,
                  fuzzy: item.to !== '/',
                })

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link to={item.to} />}
                      className={cn(
                        'sketch-badge h-9 px-2.5 font-hand',
                        isActive &&
                          'bg-sidebar-primary/20 text-sidebar-primary-foreground hover:bg-sidebar-primary/25 hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary/20 data-active:text-sidebar-primary-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                          isActive
                            ? 'border-transparent bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'border-sidebar-border bg-sidebar-accent/40 text-muted-foreground',
                        )}
                      >
                        {item.letter}
                      </span>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-4 px-4 py-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Total cash
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-sidebar-foreground tabular-nums">
            {formatCurrency(netWorth.total)}
          </p>
        </div>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  )
}
