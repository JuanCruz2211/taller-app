export default function NuevoServicioLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="animate-pulse">
        <div className="h-8 w-44 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-4 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-8 animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="mb-1.5 h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="mb-1.5 h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="mb-1.5 h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-blue-200 dark:bg-blue-900" />
        </div>
      </div>
    </div>
  );
}
