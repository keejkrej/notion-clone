'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { WorkspaceProvider } from '@/lib/workspace-store'

export function Providers({ children }: { children: React.ReactNode }) {
  return <TooltipProvider><WorkspaceProvider>{children}</WorkspaceProvider></TooltipProvider>
}
