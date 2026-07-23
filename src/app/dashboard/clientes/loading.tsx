export default function ClientesLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="animate-pulse">
        <div className="h-8 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-4 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-8 animate-pulse space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}
