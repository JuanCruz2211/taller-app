import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { serviceRecords, serviceItems } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import ServiceForm from "@/features/services/components/service-form";
import { notFound } from "next/navigation";
import type { ServiceRecord } from "@/features/services/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarServicioPage({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para editar servicios.
      </p>
    );
  }

  const workshopId = Number(session.user.id);
  const { id } = await params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    notFound();
  }

  const [record] = await db
    .select()
    .from(serviceRecords)
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

  if (record.status !== "draft") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950">
          <p className="text-lg font-medium text-amber-800 dark:text-amber-200">
            Este servicio ya está finalizado y no se puede modificar.
          </p>
        </div>
      </div>
    );
  }

  // Get items
  const items = await db
    .select()
    .from(serviceItems)
    .where(eq(serviceItems.serviceRecordId, serviceId))
    .orderBy(asc(serviceItems.sortOrder));

  const serviceData: ServiceRecord = {
    id: record.id,
    workshopId: record.workshopId,
    vehicleId: record.vehicleId,
    customerId: record.customerId,
    mechanicName: record.mechanicName,
    kmAtService: record.kmAtService,
    date: record.date.toISOString(),
    status: record.status,
    totalCost: record.totalCost,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      serviceRecordId: item.serviceRecordId,
      description: item.description,
      category: item.category,
      partCost: item.partCost,
      laborCost: item.laborCost,
      nextServiceKm: item.nextServiceKm,
      nextServiceMonths: item.nextServiceMonths,
      sortOrder: item.sortOrder,
    })),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Editar servicio
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Modificá los datos del servicio #{record.id}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ServiceForm service={serviceData} />
      </div>
    </div>
  );
}
