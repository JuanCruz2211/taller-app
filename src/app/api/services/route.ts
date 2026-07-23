import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkshopId } from "@/lib/workshop";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  serviceRecords,
  serviceItems,
  customers,
  vehicles,
} from "@/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

// ── GET /api/services ─────────────────────────────────────────────────
// Lista paginada de services del taller autenticado.
// Query params: ?search=…&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const workshopId = await getWorkshopId(headers());

    if (!workshopId) {
      return Response.json({ error: "Taller no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    // Build WHERE clause
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

    // Count total
    const countWhere = search.trim()
      ? where
      : eq(serviceRecords.workshopId, workshopId);

    const total = await db.$count(serviceRecords, countWhere);

    // Select with joins
    const rows = await db
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
      .orderBy(desc(serviceRecords.createdAt));

    const items = rows.map((row) => ({
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
    }));

    return Response.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing services:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── POST /api/services ────────────────────────────────────────────────
// Crea un nuevo service record en estado "draft".
// Body: { mechanicName, kmAtService, notes?, customerId, vehicleId, items }
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const workshopId = await getWorkshopId(headers());

    if (!workshopId) {
      return Response.json({ error: "Taller no encontrado" }, { status: 404 });
    }
    const body = await request.json();

    const {
      mechanicName,
      kmAtService,
      notes,
      customerId,
      vehicleId,
      items,
    } = body;

    // ── Validation ────────────────────────────────────────────────

    if (!mechanicName || typeof mechanicName !== "string" || !mechanicName.trim()) {
      return Response.json(
        { error: "El nombre del mecánico es obligatorio" },
        { status: 400 },
      );
    }

    if (kmAtService === undefined || kmAtService === null || isNaN(Number(kmAtService))) {
      return Response.json(
        { error: "El km en servicio es obligatorio" },
        { status: 400 },
      );
    }

    if (!customerId || typeof customerId !== "number") {
      return Response.json(
        { error: "El cliente es obligatorio" },
        { status: 400 },
      );
    }

    if (!vehicleId || typeof vehicleId !== "number") {
      return Response.json(
        { error: "El vehículo es obligatorio" },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Debe incluir al menos un item de servicio" },
        { status: 400 },
      );
    }

    // Validar items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description || typeof item.description !== "string" || !item.description.trim()) {
        return Response.json(
          { error: `El item ${i + 1} debe tener una descripción` },
          { status: 400 },
        );
      }
    }

    // Verificar que el cliente y vehículo pertenecen al taller
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.workshopId, workshopId)))
      .limit(1);

    if (!customer) {
      return Response.json(
        { error: "El cliente seleccionado no existe" },
        { status: 400 },
      );
    }

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.workshopId, workshopId)))
      .limit(1);

    if (!vehicle) {
      return Response.json(
        { error: "El vehículo seleccionado no existe" },
        { status: 400 },
      );
    }

    // ── Insert (sequential — HTTP driver doesn't support transactions) ──

    // Calcular totalCost desde los items
    const totalCost = items.reduce(
      (acc: number, item: { partCost?: string; laborCost?: string }) => {
        const part = parseFloat(item.partCost ?? "0") || 0;
        const labor = parseFloat(item.laborCost ?? "0") || 0;
        return acc + part + labor;
      },
      0,
    );

    const [record] = await db
      .insert(serviceRecords)
      .values({
        workshopId,
        customerId,
        vehicleId,
        mechanicName: mechanicName.trim(),
        kmAtService: Number(kmAtService),
        status: "draft",
        totalCost: totalCost.toFixed(2),
        notes: notes?.trim() ?? null,
      })
      .returning();

    // Insertar items
    const itemValues = items.map(
      (item: {
        description: string;
        partCost?: string;
        laborCost?: string;
        category?: string;
        nextServiceKm?: string;
        nextServiceMonths?: string;
      }, idx: number) => ({
        serviceRecordId: record.id,
        description: item.description.trim(),
        partCost: (parseFloat(item.partCost ?? "0") || 0).toFixed(2),
        laborCost: (parseFloat(item.laborCost ?? "0") || 0).toFixed(2),
        category: item.category?.trim() ?? null,
        nextServiceKm: item.nextServiceKm ? parseInt(item.nextServiceKm, 10) : null,
        nextServiceMonths: item.nextServiceMonths ? parseInt(item.nextServiceMonths, 10) : null,
        sortOrder: idx,
      }),
    );

    await db.insert(serviceItems).values(itemValues);

    return Response.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
