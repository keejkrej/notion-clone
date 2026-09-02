'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export const APPEARANCE_STORAGE_KEY = 'notion-clone:appearance'

export type Appearance = 'light' | 'dark' | 'system'

function isAppearance(value: string | null): value is Appearance {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readStoredAppearance(): Appearance {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY)
    return isAppearance(raw) ? raw : 'light'
  } catch {
    return 'light'
  }
}

export function applyAppearance(appearance: Appearance) {
  const dark =
    appearance === 'dark' ||
    (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

interface AppearanceContextValue {
  appearance: Appearance
  setAppearance: (next: Appearance) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = readStoredAppearance()
    setAppearanceState(stored)
    applyAppearance(stored)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    applyAppearance(appearance)
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance)
    } catch {
      // ignore quota / private-mode failures
    }
    if (appearance !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyAppearance('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [appearance, ready])

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next)
  }, [])

  const value = useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance])
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider')
  return ctx
}
