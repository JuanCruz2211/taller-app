export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 space-y-4">
        <div className="h-12 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 w-3/4 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
