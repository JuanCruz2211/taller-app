"use client";

import Link from "next/link";
import type { Vehicle } from "../types";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {vehicle.patente}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </p>
        </div>

        <Link
          href={`/dashboard/vehiculos/${vehicle.id}/editar`}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Editar
        </Link>
      </div>

      {/* Details */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <svg
            className="h-5 w-5 shrink-0 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            Dueño:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {vehicle.customerName ?? "—"}
            </span>
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Link
          href={`/dashboard/vehiculos/${vehicle.id}`}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
