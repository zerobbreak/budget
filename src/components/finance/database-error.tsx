export function DatabaseError({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Could not load finance data</h1>
      <p className="mt-3 text-gray-700">{error.message}</p>
      <p className="mt-2 text-sm text-gray-500">
        If you recently changed the database schema, run{' '}
        <code className="rounded bg-muted px-1 py-0.5">npm run db:generate</code>
        , then restart the dev server. Otherwise check{' '}
        <code className="rounded bg-muted px-1 py-0.5">DATABASE_URL</code> in
        your <code className="rounded bg-muted px-1 py-0.5">.env</code> file and
        run{' '}
        <code className="rounded bg-muted px-1 py-0.5">npm run db:deploy</code>{' '}
        and{' '}
        <code className="rounded bg-muted px-1 py-0.5">npm run db:seed</code>.
      </p>
    </div>
  )
}
