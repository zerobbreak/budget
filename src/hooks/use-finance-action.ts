import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export function useFinanceAction() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setPending(true)
    setError(null)

    try {
      await action()
      await router.invalidate({ sync: true })
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Something went wrong.'
      setError(message)
      throw caught
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error, setError }
}
