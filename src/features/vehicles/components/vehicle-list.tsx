"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import type { Vehicle, VehicleListResponse } from "../types";

interface VehicleListProps {
  initialData: VehicleListResponse;
}

export default function VehicleList({ initialData }: VehicleListProps) {
  const [data, setData] = useState<VehicleListResponse>(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/vehicles?${params.toString()}`);
      if (res.ok) {
        const json: VehicleListResponse = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail — data keeps previous state
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  // Fetch on search/page change
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    // The useEffect will trigger the fetch
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por patente, marca o modelo…"
            className="block w-full rounded-xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Buscar
        </button>
        <Link
          href="/dashboard/vehiculos/nuevo"
          className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          + Nuevo
        </Link>
      </form>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 flex items-center justify-center py-8">
          <svg
            className="h-6 w-6 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!loading && data.items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {search.trim()
              ? "No se encontraron vehículos con esa búsqueda"
              : "Todavía no tenés vehículos registrados"}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {search.trim()
              ? "Probá con otro término de búsqueda"
              : "Agregá el primer vehículo para empezar"}
          </p>
          {!search.trim() && (
            <Link
              href="/dashboard/vehiculos/nuevo"
              className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              + Agregar vehículo
            </Link>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && data.items.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Patente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Marca / Modelo
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell dark:text-zinc-400">
                  Año
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell dark:text-zinc-400">
                  Cliente
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.items.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {vehicle.patente}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {vehicle.brand} {vehicle.model}
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {vehicle.year ?? "—"}
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {vehicle.customerName ?? "—"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/vehiculos/${vehicle.id}`}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Página {data.page} de {data.totalPages} ({data.total} vehículos)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
