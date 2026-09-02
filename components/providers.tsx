'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { AppearanceProvider } from '@/lib/appearance'
import { WorkspaceProvider } from '@/lib/workspace-store'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <AppearanceProvider>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </AppearanceProvider>
    </TooltipProvider>
  )
}
