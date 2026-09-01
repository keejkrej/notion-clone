'use client'

import { ThemeProvider, BaseStyles } from '@primer/react'
import { StyledComponentsRegistry } from './styled-components-registry'
import { WorkspaceProvider } from '@/lib/workspace-store'

/**
 * App-wide Primer providers. The theme attributes that the @primer/primitives
 * theme CSS keys off of (data-color-mode / data-light-theme / data-dark-theme)
 * are set on <html> in app/layout.tsx so the document background resolves too.
 * Here we mirror that mode on ThemeProvider so styled-components reads matching
 * theme values. BaseStyles applies Primer's base typography + color.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider
        colorMode="night"
        dayScheme="light"
        nightScheme="dark"
        preventSSRMismatch
      >
        <BaseStyles>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </BaseStyles>
      </ThemeProvider>
    </StyledComponentsRegistry>
  )
}
