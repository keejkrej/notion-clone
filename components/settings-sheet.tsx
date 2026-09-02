'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { type Appearance, useAppearance } from '@/lib/appearance'
import { useWorkspace } from '@/lib/workspace-store'

const APPEARANCE_OPTIONS: { id: Appearance; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

export function SettingsSheet() {
  const { settingsOpen, setSettingsOpen, ws, renameWorkspace } = useWorkspace()
  const { appearance, setAppearance } = useAppearance()

  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Workspace name and appearance.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={ws.name}
              onChange={(e) => renameWorkspace(e.target.value)}
              placeholder="Untitled workspace"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label htmlFor="appearance-system">Appearance</Label>
                <p className="text-xs text-muted-foreground">Light is the default. System follows your OS.</p>
              </div>
              <Switch
                id="appearance-system"
                checked={appearance === 'system'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setAppearance('system')
                    return
                  }
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                  setAppearance(prefersDark ? 'dark' : 'light')
                }}
                aria-label="Use system appearance"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = appearance === opt.id
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant={selected ? 'secondary' : 'outline'}
                    className="h-auto flex-col gap-1 py-3"
                    aria-pressed={selected}
                    aria-label={opt.label}
                    onClick={() => setAppearance(opt.id)}
                  >
                    <Icon className="size-4" />
                    <span className="text-xs">{opt.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
