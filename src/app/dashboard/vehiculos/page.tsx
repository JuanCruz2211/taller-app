import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vehicles, customers } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import VehicleList from "@/features/vehicles/components/vehicle-list";
import type { VehicleListResponse } from "@/features/vehicles/types";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function VehiculosPage({ searchParams }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver los vehículos.
      </p>
    );
  }

  const workshopId = Number(session.user.id);
  const sp = await searchParams;
  const search = sp.search ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const baseConditions = [eq(vehicles.workshopId, workshopId)];

  if (search.trim()) {
    baseConditions.push(
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      or(
        ilike(vehicles.patente, `%${search.trim()}%`),
        ilike(vehicles.brand, `%${search.trim()}%`),
        ilike(vehicles.model, `%${search.trim()}%`),
      )!,
    );
  }

  const where = and(...baseConditions);

  const [total, rows] = await Promise.all([
    db.$count(vehicles, where),
    db
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
      })
      .from(vehicles)
      .leftJoin(customers, eq(vehicles.customerId, customers.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(vehicles.patente),
  ]);

  const initialData: VehicleListResponse = {
    items: rows.map((row) => ({
      id: row.id,
      workshopId: row.workshopId,
      customerId: row.customerId,
      patente: row.patente,
      brand: row.brand,
      model: row.model,
      year: row.year,
      currentKm: row.currentKm,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customerName: row.customerName ?? undefined,
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
            Vehículos
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Administrá los vehículos de tu taller
          </p>
        </div>
      </div>

      <div className="mt-8">
        <VehicleList initialData={initialData} />
      </div>
    </div>
  );
}
