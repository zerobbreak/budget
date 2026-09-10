import { Link, getRouteApi, useMatchRoute } from '@tanstack/react-router'
import { BookOpen, LogOut } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { formatCurrency, navItems } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

const financeRoute = getRouteApi('/_finance')

export function AppSidebar() {
  const matchRoute = useMatchRoute()
  const { setOpenMobile } = useSidebar()
  const { netWorth } = financeRoute.useLoaderData()
  const { user } = financeRoute.useRouteContext()

  async function signOut() {
    await authClient.signOut()
    window.location.assign('/login')
  }

  return (
    <Sidebar className="border-r-[1.75px] border-dashed border-[var(--sketch-ink)]">
      <SidebarHeader className="px-4 py-6">
        <p className="sketch-underline font-hand text-lg font-semibold tracking-tight text-sidebar-foreground">
          Nocturne Finance
        </p>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu id="tour-sidebar-nav" className="gap-1">
              {navItems.map((item) => {
                const isActive = !!matchRoute({
                  to: item.to,
                  fuzzy: item.to !== '/',
                })

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <Link
                          to={item.to}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                      className={cn(
                        'sketch-badge h-10 px-2.5 font-hand md:h-9',
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
      <SidebarFooter className="gap-4 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="rounded-xl border border-dashed border-sidebar-border bg-sidebar-accent/30 p-3">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {user.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {user.email}
          </p>
          <Button
            id="tour-guide-link"
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'mt-2 w-full justify-start px-1.5 text-muted-foreground',
              !!matchRoute({ to: '/guide' }) && 'text-sidebar-primary',
            )}
            render={<Link to="/guide" onClick={() => setOpenMobile(false)} />}
          >
            <BookOpen />
            Guide
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start px-1.5 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut />
            Sign out
          </Button>
        </div>
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
