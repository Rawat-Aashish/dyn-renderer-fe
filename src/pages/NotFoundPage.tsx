export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-brand-600">404</p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The address may be mistyped, or the page may have moved.</p>
    </div>
  )
}
