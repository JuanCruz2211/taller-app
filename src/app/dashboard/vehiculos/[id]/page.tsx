import { headers } from "next/headers";
import { getWorkshopId } from "@/lib/workshop";
import { db } from "@/lib/db";
import { vehicles, customers, serviceRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/delete-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VehiculoDetailPage({ params }: Props) {
  const workshopId = await getWorkshopId(headers());

  if (!workshopId) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver el detalle del vehículo.
      </p>
    );
  }
  const { id } = await params;
  const vehicleId = parseInt(id, 10);

  if (isNaN(vehicleId)) {
    notFound();
  }

  // Get vehicle with customer join
  const [row] = await db
    .select({
      id: vehicles.id,
      workshopId: vehicles.workshopId,
      customerId: vehicles.customerId,
      patente: vehicles.patente,
      brand: vehicles.brand,
      model: vehicles.model,
      year: vehicles.year,
      currentKm: vehicles.currentKm,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(vehicles)
    .leftJoin(customers, eq(vehicles.customerId, customers.id))
    .where(
      and(eq(vehicles.id, vehicleId), eq(vehicles.workshopId, workshopId)),
    )
    .limit(1);

  if (!row) {
    notFound();
  }

  // Get related service records count (placeholder for now)
  const serviceCount = await db.$count(
    serviceRecords,
    and(
      eq(serviceRecords.vehicleId, vehicleId),
      eq(serviceRecords.workshopId, workshopId),
    ),
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard/vehiculos"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Volver a vehículos
      </Link>

      {/* Vehicle header */}
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {row.patente}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {row.brand} {row.model}
            {row.year ? ` · ${row.year}` : ""}
            {" — Registrado "}
            {row.createdAt.toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/vehiculos/${row.id}/editar`}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Editar vehículo
          </Link>

          <DeleteButton
            deleteUrl={`/api/vehicles/${row.id}`}
            entityName="vehículo"
            redirectTo="/dashboard/vehiculos"
          />
        </div>
      </div>

      {/* Vehicle info card */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Información del vehículo
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Patente
            </dt>
            <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {row.patente}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Marca
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {row.brand}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Modelo
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {row.model}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Año
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {row.year ?? "—"}
            </dd>
          </div>
          {row.currentKm && (
            <div className="flex items-center gap-3">
              <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                KM actuales
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-50">
                {row.currentKm.toLocaleString("es-AR")} km
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Owner info card */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Dueño
        </h2>
        <dl className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Nombre
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {row.customerName ?? "—"}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Teléfono
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {row.customerPhone ?? "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <Link
            href={`/dashboard/clientes/${row.customerId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Ver ficha del cliente →
          </Link>
        </div>
      </div>

      {/* Service records section — placeholder */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Servicios ({serviceCount})
        </h2>
        {serviceCount > 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            El historial de servicios se mostrará cuando se implemente la
            sección de servicios.
          </p>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Este vehículo no tiene servicios registrados todavía.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
