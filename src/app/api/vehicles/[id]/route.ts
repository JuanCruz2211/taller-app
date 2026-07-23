import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vehicles, customers, serviceRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validatePatente } from "@/lib/phone";

// ── HELPERS ─────────────────────────────────────────────────────────

async function getVehicleOrThrow(
  vehicleId: number,
  workshopId: number,
): Promise<typeof vehicles.$inferSelect | null> {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(
      and(eq(vehicles.id, vehicleId), eq(vehicles.workshopId, workshopId)),
    )
    .limit(1);

  return vehicle ?? null;
}

// ── GET /api/vehicles/[id] ───────────────────────────────────────────
// Detalle de un vehículo con datos del cliente asociado.
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

    const workshopId = Number(session.user.id);
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    if (isNaN(vehicleId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
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
      return Response.json(
        { error: "Vehículo no encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
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
      customerPhone: row.customerPhone ?? undefined,
    });
  } catch (error) {
    console.error("Error getting vehicle:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── PUT /api/vehicles/[id] ───────────────────────────────────────────
// Actualiza un vehículo.
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

    const workshopId = Number(session.user.id);
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    if (isNaN(vehicleId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que el vehículo existe y pertenece al taller
    const existing = await getVehicleOrThrow(vehicleId, workshopId);
    if (!existing) {
      return Response.json(
        { error: "Vehículo no encontrado" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { patente, brand, model, year, customerId } = body;

    const updateData: Record<string, unknown> = {};

    if (patente !== undefined) {
      if (typeof patente !== "string") {
        return Response.json(
          { error: "Patente inválida" },
          { status: 400 },
        );
      }
      if (!validatePatente(patente)) {
        return Response.json(
          {
            error:
              "Formato de patente inválido. Usá formato viejo (ABC-123) o nuevo (AB-123-CD)",
          },
          { status: 400 },
        );
      }
      updateData.patente = patente.toUpperCase().trim();
    }

    if (brand !== undefined) {
      if (typeof brand !== "string" || brand.trim().length === 0) {
        return Response.json(
          { error: "La marca no puede estar vacía" },
          { status: 400 },
        );
      }
      updateData.brand = brand.trim();
    }

    if (model !== undefined) {
      if (typeof model !== "string" || model.trim().length === 0) {
        return Response.json(
          { error: "El modelo no puede estar vacío" },
          { status: 400 },
        );
      }
      updateData.model = model.trim();
    }

    if (year !== undefined) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return Response.json(
          { error: "Año inválido" },
          { status: 400 },
        );
      }
      updateData.year = yearNum;
    }

    if (customerId !== undefined) {
      if (typeof customerId !== "number") {
        return Response.json(
          { error: "Cliente inválido" },
          { status: 400 },
        );
      }
      // Verificar que el cliente existe y pertenece al taller
      const [customer] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, customerId),
            eq(customers.workshopId, workshopId),
          ),
        )
        .limit(1);

      if (!customer) {
        return Response.json(
          { error: "El cliente seleccionado no existe" },
          { status: 400 },
        );
      }
      updateData.customerId = customerId;
    }

    // No fields to update
    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No se enviaron campos para actualizar" },
        { status: 400 },
      );
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, vehicleId))
      .returning();

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/vehicles/[id] ────────────────────────────────────────
// Elimina un vehículo (solo si no tiene servicios asociados).
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

    const workshopId = Number(session.user.id);
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    if (isNaN(vehicleId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que existe y pertenece al taller
    const existing = await getVehicleOrThrow(vehicleId, workshopId);
    if (!existing) {
      return Response.json(
        { error: "Vehículo no encontrado" },
        { status: 404 },
      );
    }

    // Verificar que no tenga servicios asociados
    const serviceCount = await db.$count(
      serviceRecords,
      and(
        eq(serviceRecords.vehicleId, vehicleId),
        eq(serviceRecords.workshopId, workshopId),
      ),
    );

    if (serviceCount > 0) {
      return Response.json(
        {
          error:
            "No se puede eliminar el vehículo porque tiene servicios asociados",
        },
        { status: 409 },
      );
    }

    await db.delete(vehicles).where(eq(vehicles.id, vehicleId));

    return Response.json({ message: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
