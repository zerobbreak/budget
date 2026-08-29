export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'
export const DEFAULT_THEME: Theme = 'dark'

const listeners = new Set<() => void>()

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){document.documentElement.classList.add('dark')}})()`

export function getTheme(): Theme {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // Ignore storage access errors (private mode, blocked storage).
  }

  return DEFAULT_THEME
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage write errors.
  }

  applyTheme(theme)
  listeners.forEach((listener) => listener())
}

export function subscribeToTheme(listener: () => void) {
  listeners.add(listener)

  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage)
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorage)
    }
  }
}

function onStorage(event: StorageEvent) {
  if (event.key === THEME_STORAGE_KEY) {
    const theme = event.newValue === 'light' ? 'light' : DEFAULT_THEME
    applyTheme(theme)
    listeners.forEach((listener) => listener())
  }
}
