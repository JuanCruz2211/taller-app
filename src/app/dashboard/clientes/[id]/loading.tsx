export default function ClienteDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="mt-4 animate-pulse">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-1 h-4 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      <div className="mt-6 animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-44 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      <div className="mt-6 animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-4 h-24 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>

      <div className="mt-6 animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-4 h-24 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
