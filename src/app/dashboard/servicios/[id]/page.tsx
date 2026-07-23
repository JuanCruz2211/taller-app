import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  serviceRecords,
  serviceItems,
  customers,
  vehicles,
  workshops,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import FinalizeButton from "@/features/services/components/finalize-button";
import ShareButton from "@/features/reports/components/share-button";

interface Props {
  params: Promise<{ id: string }>;
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

export default async function ServicioDetailPage({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver el detalle del servicio.
      </p>
    );
  }

  const workshopId = Number(session.user.id);
  const { id } = await params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    notFound();
  }

  // Get service record with customer and vehicle join
  const [record] = await db
    .select({
      id: serviceRecords.id,
      workshopId: serviceRecords.workshopId,
      vehicleId: serviceRecords.vehicleId,
      customerId: serviceRecords.customerId,
      mechanicName: serviceRecords.mechanicName,
      kmAtService: serviceRecords.kmAtService,
      date: serviceRecords.date,
      status: serviceRecords.status,
      totalCost: serviceRecords.totalCost,
      notes: serviceRecords.notes,
      createdAt: serviceRecords.createdAt,
      updatedAt: serviceRecords.updatedAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      vehiclePatente: vehicles.patente,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
    })
    .from(serviceRecords)
    .leftJoin(customers, eq(serviceRecords.customerId, customers.id))
    .leftJoin(vehicles, eq(serviceRecords.vehicleId, vehicles.id))
    .where(
      and(
        eq(serviceRecords.id, serviceId),
        eq(serviceRecords.workshopId, workshopId),
      ),
    )
    .limit(1);

  if (!record) {
    notFound();
  }

  // Get service items
  const items = await db
    .select()
    .from(serviceItems)
    .where(eq(serviceItems.serviceRecordId, serviceId))
    .orderBy(asc(serviceItems.sortOrder));

  // Get workshop data for ShareButton
  const [workshop] = await db
    .select()
    .from(workshops)
    .where(eq(workshops.id, workshopId))
    .limit(1);

  const status = statusConfig[record.status] ?? {
    label: record.status,
    classes:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard/servicios"
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
        Volver a servicios
      </Link>

      {/* Service header */}
      <div className="mt-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Servicio #{record.id}
            </h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {record.createdAt.toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {record.status === "draft" && (
            <>
              <Link
                href={`/dashboard/servicios/${record.id}/editar`}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Editar
              </Link>

              <FinalizeButton serviceId={record.id} />
            </>
          )}

          {record.status === "finalized" && (
            <>
              <a
                href={`/api/reports/${record.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Descargar PDF
              </a>

              <ShareButton
                serviceId={record.id}
                customerPhone={record.customerPhone ?? null}
                workshopName={workshop.name}
                vehiclePatente={record.vehiclePatente ?? ""}
              />
            </>
          )}
        </div>
      </div>

      {/* Service info cards */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Customer info */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Cliente
          </h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Nombre
              </dt>
              <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {record.customerName ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Teléfono
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-50">
                {record.customerPhone ?? "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <Link
              href={`/dashboard/clientes/${record.customerId}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Ver ficha del cliente →
            </Link>
          </div>
        </div>

        {/* Vehicle info */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Vehículo
          </h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Patente
              </dt>
              <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {record.vehiclePatente ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Marca / Modelo
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-50">
                {record.vehicleBrand ?? "—"} {record.vehicleModel ?? ""}
              </dd>
            </div>
            {record.vehicleYear && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Año
                </dt>
                <dd className="text-sm text-zinc-900 dark:text-zinc-50">
                  {record.vehicleYear}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4">
            <Link
              href={`/dashboard/vehiculos/${record.vehicleId}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Ver ficha del vehículo →
            </Link>
          </div>
        </div>
      </div>

      {/* Service details */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Detalle del servicio
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <dt className="w-28 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Mecánico
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {record.mechanicName}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-28 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              KM en servicio
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {record.kmAtService.toLocaleString("es-AR")} km
            </dd>
          </div>
        </dl>

        {record.notes && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Notas
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {record.notes}
            </dd>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Items de servicio
        </h2>

        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Este servicio no tiene items registrados.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Repuestos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Mano de obra
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item, idx) => {
                  const part = parseFloat(item.partCost) || 0;
                  const labor = parseFloat(item.laborCost) || 0;
                  const total = part + labor;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {item.description}
                        </div>
                        {item.category && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {item.category}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        ${part.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        ${labor.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        ${total.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Total
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    ${parseFloat(record.totalCost).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Next service info */}
        {items.some(
          (i) => i.nextServiceKm || i.nextServiceMonths,
        ) && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Próximos services
            </h3>
            {items
              .filter((i) => i.nextServiceKm || i.nextServiceMonths)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                >
                  <span className="font-medium">{item.description}</span>:{" "}
                  {item.nextServiceKm && (
                    <span>{item.nextServiceKm.toLocaleString("es-AR")} km</span>
                  )}
                  {item.nextServiceKm && item.nextServiceMonths && (
                    <span> o </span>
                  )}
                  {item.nextServiceMonths && (
                    <span>{item.nextServiceMonths} meses</span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
