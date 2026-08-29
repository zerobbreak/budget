import { useCallback, useSyncExternalStore } from 'react'

import {
  DEFAULT_THEME,
  getTheme,
  setTheme,
  subscribeToTheme,
} from '@/lib/theme'

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getTheme,
    () => DEFAULT_THEME,
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
