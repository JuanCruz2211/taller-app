"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950">
        <svg
          className="h-8 w-8 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        Algo salió mal
      </h1>

      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ocurrió un error inesperado en el panel de control. Volvé a intentarlo o
        contactá al soporte si el problema persiste.
      </p>

      {error.digest && (
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
          Código: {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
