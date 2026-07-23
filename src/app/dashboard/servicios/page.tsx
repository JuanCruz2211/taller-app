import { headers } from "next/headers";
import { getWorkshopId } from "@/lib/workshop";
import { db } from "@/lib/db";
import {
  serviceRecords,
  customers,
  vehicles,
} from "@/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import ServiceList from "@/features/services/components/service-list";
import type { ServiceListResponse } from "@/features/services/types";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ServiciosPage({ searchParams }: Props) {
  const workshopId = await getWorkshopId(headers());

  if (!workshopId) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver los servicios.
      </p>
    );
  }
  const sp = await searchParams;
  const search = sp.search ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const baseConditions = [eq(serviceRecords.workshopId, workshopId)];

  if (search.trim()) {
    baseConditions.push(
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      or(
        ilike(serviceRecords.mechanicName, `%${search.trim()}%`),
        ilike(serviceRecords.notes, `%${search.trim()}%`),
        ilike(customers.name, `%${search.trim()}%`),
        ilike(vehicles.patente, `%${search.trim()}%`),
      )!,
    );
  }

  const where = and(...baseConditions);

  const countWhere = search.trim()
    ? where
    : eq(serviceRecords.workshopId, workshopId);

  const [total, rows] = await Promise.all([
    db.$count(serviceRecords, countWhere),
    db
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
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(serviceRecords.createdAt)),
  ]);

  const initialData: ServiceListResponse = {
    items: rows.map((row) => ({
      id: row.id,
      workshopId: row.workshopId,
      vehicleId: row.vehicleId,
      customerId: row.customerId,
      mechanicName: row.mechanicName,
      kmAtService: row.kmAtService,
      date: row.date.toISOString(),
      status: row.status,
      totalCost: row.totalCost,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customerName: row.customerName ?? undefined,
      customerPhone: row.customerPhone ?? undefined,
      vehiclePatente: row.vehiclePatente ?? undefined,
      vehicleBrand: row.vehicleBrand ?? undefined,
      vehicleModel: row.vehicleModel ?? undefined,
      vehicleYear: row.vehicleYear ?? undefined,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Servicios
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Administrá los servicios de tu taller
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ServiceList initialData={initialData} />
      </div>
    </div>
  );
}
