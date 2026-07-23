export default function VehiculosLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="animate-pulse">
        <div className="h-8 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-4 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-8 animate-pulse space-y-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="ml-auto h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="ml-auto h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="ml-auto h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
