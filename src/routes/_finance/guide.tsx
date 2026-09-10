import { createFileRoute } from '@tanstack/react-router'

import { GuideDashboard } from '@/components/guide-dashboard'

export const Route = createFileRoute('/_finance/guide')({
  component: GuideDashboard,
})
