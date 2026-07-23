"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface HistoryItem {
  id: number;
  date: string;
  status: "draft" | "finalized";
  totalCost: string;
  mechanicName: string;
  kmAtService: number;
  customerName?: string;
  vehiclePatente?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusConfig: Record<
  string,
  { label: string; classes: string }
> = {
  draft: {
    label: "Borrador",
    classes:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  finalized: {
    label: "Finalizado",
    classes:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

export default function HistorialPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/services?${params.toString()}`);
      if (!res.ok) throw new Error("Error al obtener el historial");

      const json: HistoryResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error del servidor");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  // Fetch on mount and when page/search changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Historial de Servicios
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Buscá servicios por patente o nombre del cliente
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por patente o nombre del cliente…"
            className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Cargando…
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No se encontraron servicios
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {search.trim()
              ? "Probá con otro término de búsqueda."
              : "Todavía no hay servicios registrados."}
          </p>
        </div>
      )}

      {/* Results */}
      {data && data.items.length > 0 && (
        <>
          {/* Results count */}
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            {data.total} resultado{data.total !== 1 ? "s" : ""}
            {search.trim() && ` para "${search}"`}
          </p>

          {/* List */}
          <div className="mt-3 space-y-3">
            {data.items.map((item) => {
              const status = statusConfig[item.status] ?? {
                label: item.status,
                classes:
                  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
              };

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/servicios/${item.id}`}
                  className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          #{item.id}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {item.customerName ?? "—"} —{" "}
                        {item.vehicleBrand ?? ""} {item.vehicleModel ?? ""}
                        {item.vehiclePatente && (
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {" "}
                            ({item.vehiclePatente})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {item.mechanicName} —{" "}
                        {new Date(item.date).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        ${parseFloat(item.totalCost).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {item.kmAtService.toLocaleString("es-AR")} km
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Anterior
              </button>
              <span className="px-3 text-sm text-zinc-600 dark:text-zinc-400">
                Página {data.page} de {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
