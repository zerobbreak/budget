import { Link } from '@tanstack/react-router'
import { ArrowRight, KeyRound, LoaderCircle, MoonStar } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'

type AuthFormProps = {
  mode: 'login' | 'register'
  redirectTo: string
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const isRegister = mode === 'register'
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()

    const result = isRegister
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    if (result.error) {
      setError(
        result.error.message ??
          (isRegister
            ? 'We could not create your account.'
            : 'Email or password is incorrect.'),
      )
      setPending(false)
      return
    }

    window.location.assign(redirectTo)
  }

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute top-[12%] left-[8%] hidden size-44 rounded-full border border-dashed border-primary/30 sm:block"
      />
      <div
        aria-hidden="true"
        className="absolute right-[7%] bottom-[10%] hidden h-32 w-56 rotate-[-7deg] rounded-[50%] bg-primary/8 blur-3xl sm:block"
      />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px_12px_28px_16px/16px_30px_14px_28px] border-2 border-[var(--sketch-ink)] bg-card/95 shadow-2xl shadow-black/20 backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground md:flex">
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-20 size-72 rounded-full border-[36px] border-primary-foreground/8"
          />
          <div className="relative flex items-center gap-3 font-hand text-xl">
            <span className="grid size-10 place-items-center rounded-full border border-primary-foreground/40">
              <MoonStar className="size-5" />
            </span>
            Nocturne Finance
          </div>

          <div className="relative">
            <p className="mb-5 font-hand text-sm tracking-[0.22em] uppercase opacity-70">
              Your private ledger
            </p>
            <h1 className="font-heading text-4xl leading-[1.15] tracking-tight lg:text-5xl">
              Money feels clearer when it has a place.
            </h1>
            <div className="mt-10 h-px w-32 bg-primary-foreground/35" />
            <p className="mt-6 max-w-sm text-base leading-7 opacity-75">
              Track the details, notice the patterns, and keep every account
              safely yours.
            </p>
          </div>

          <p className="relative font-script text-xl opacity-60">
            Quiet numbers. Confident decisions.
          </p>
        </div>

        <div className="flex min-h-0 items-center p-6 sm:p-12 md:min-h-[620px]">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-9 md:hidden">
              <span className="flex items-center gap-2 font-hand text-lg text-primary">
                <MoonStar className="size-5" />
                Nocturne Finance
              </span>
            </div>

            <span className="mb-6 grid size-11 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </span>
            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
              {isRegister ? 'Begin your ledger' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isRegister
                ? 'Create a private space for your accounts and goals.'
                : 'Sign in to continue to your private finance workspace.'}
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {isRegister ? (
                <label className="block space-y-2">
                  <span className="font-hand text-sm">Your name</span>
                  <Input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={80}
                    placeholder="How should we greet you?"
                    className="h-11"
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="font-hand text-sm">Email address</span>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-11"
                />
              </label>

              <label className="block space-y-2">
                <span className="font-hand text-sm">Password</span>
                <Input
                  name="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
                  className="h-11"
                />
              </label>

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full text-base"
                disabled={pending}
              >
                {pending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}
                {pending
                  ? isRegister
                    ? 'Creating your space…'
                    : 'Signing in…'
                  : isRegister
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              {isRegister ? 'Already have an account?' : 'New to Nocturne?'}{' '}
              <Link
                to={isRegister ? '/login' : '/register'}
                search={{ redirect: redirectTo }}
                className="font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
              >
                {isRegister ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
