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
import { eq, and, asc } from "drizzle-orm";

// ── HELPERS ─────────────────────────────────────────────────────────

async function getServiceOrThrow(
  serviceId: number,
  workshopId: number,
) {
  const [row] = await db
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

  return row ?? null;
}

async function getItemsForService(serviceId: number) {
  return db
    .select()
    .from(serviceItems)
    .where(eq(serviceItems.serviceRecordId, serviceId))
    .orderBy(asc(serviceItems.sortOrder));
}

// ── GET /api/services/[id] ───────────────────────────────────────────
// Detalle completo de un service record con items, customer y vehicle.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const record = await getServiceOrThrow(serviceId, workshopId);

    if (!record) {
      return Response.json(
        { error: "Service no encontrado" },
        { status: 404 },
      );
    }

    const items = await getItemsForService(serviceId);

    return Response.json({
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
      customerName: record.customerName ?? undefined,
      customerPhone: record.customerPhone ?? undefined,
      vehiclePatente: record.vehiclePatente ?? undefined,
      vehicleBrand: record.vehicleBrand ?? undefined,
      vehicleModel: record.vehicleModel ?? undefined,
      vehicleYear: record.vehicleYear ?? undefined,
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
    });
  } catch (error) {
    console.error("Error getting service:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── PUT /api/services/[id] ───────────────────────────────────────────
// Actualiza un service record (solo si está en draft).
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que existe y pertenece al taller
    const existing = await getServiceOrThrow(serviceId, workshopId);
    if (!existing) {
      return Response.json(
        { error: "Service no encontrado" },
        { status: 404 },
      );
    }

    // Solo se puede editar si está en draft
    if (existing.status !== "draft") {
      return Response.json(
        { error: "No se puede modificar un servicio finalizado" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const { mechanicName, kmAtService, notes, items } = body;

    const updateData: Record<string, unknown> = {};

    if (mechanicName !== undefined) {
      if (typeof mechanicName !== "string" || !mechanicName.trim()) {
        return Response.json(
          { error: "El nombre del mecánico no puede estar vacío" },
          { status: 400 },
        );
      }
      updateData.mechanicName = mechanicName.trim();
    }

    if (kmAtService !== undefined) {
      const km = Number(kmAtService);
      if (isNaN(km)) {
        return Response.json(
          { error: "Kilometraje inválido" },
          { status: 400 },
        );
      }
      updateData.kmAtService = km;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() ?? null;
    }

    // Si hay items, recalcular totalCost
    let totalCost: string | undefined;
    if (Array.isArray(items) && items.length > 0) {
      const cost = items.reduce(
        (acc: number, item: { partCost?: string; laborCost?: string }) => {
          const part = parseFloat(item.partCost ?? "0") || 0;
          const labor = parseFloat(item.laborCost ?? "0") || 0;
          return acc + part + labor;
        },
        0,
      );
      totalCost = cost.toFixed(2);
    }

    // No fields to update
    if (Object.keys(updateData).length === 0 && totalCost === undefined) {
      return Response.json(
        { error: "No se enviaron campos para actualizar" },
        { status: 400 },
      );
    }

    updateData.updatedAt = new Date();
    if (totalCost !== undefined) {
      updateData.totalCost = totalCost;
    }

    // Actualizar (sequential — HTTP driver doesn't support transactions)
    const [updated] = await db
      .update(serviceRecords)
      .set(updateData)
      .where(eq(serviceRecords.id, serviceId))
      .returning();

    // Si hay items, reemplazar todos
    if (Array.isArray(items) && items.length > 0) {
      // Eliminar items existentes
      await db
        .delete(serviceItems)
        .where(eq(serviceItems.serviceRecordId, serviceId));

      // Insertar nuevos items
      const itemValues = items.map(
        (item: {
          description: string;
          partCost?: string;
          laborCost?: string;
          category?: string;
          nextServiceKm?: string;
          nextServiceMonths?: string;
        }, idx: number) => ({
          serviceRecordId: serviceId,
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
    }

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating service:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/services/[id] ────────────────────────────────────────
// Elimina un service record + items en transacción (solo si está en draft).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que existe y pertenece al taller
    const existing = await getServiceOrThrow(serviceId, workshopId);
    if (!existing) {
      return Response.json(
        { error: "Service no encontrado" },
        { status: 404 },
      );
    }

    // Solo se puede eliminar si está en draft
    if (existing.status !== "draft") {
      return Response.json(
        { error: "No se puede eliminar un servicio finalizado" },
        { status: 409 },
      );
    }

    // Eliminar en transacción (cascade maneja items por FK onDelete)
    await db.delete(serviceRecords).where(eq(serviceRecords.id, serviceId));

    return Response.json({ message: "Servicio eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
