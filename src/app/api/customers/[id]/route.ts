import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkshopId } from "@/lib/workshop";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { customers, serviceRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";

// ── HELPERS ─────────────────────────────────────────────────────────

async function getCustomerOrThrow(
  customerId: number,
  workshopId: number,
): Promise<typeof customers.$inferSelect | null> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.workshopId, workshopId)))
    .limit(1);

  return customer ?? null;
}

// ── GET /api/customers/[id] ─────────────────────────────────────────
// Detalle de un cliente.
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
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const customer = await getCustomerOrThrow(customerId, workshopId);

    if (!customer) {
      return Response.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    return Response.json(customer);
  } catch (error) {
    console.error("Error getting customer:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── PUT /api/customers/[id] ─────────────────────────────────────────
// Actualiza un cliente.
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
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que el cliente existe y pertenece al taller
    const existing = await getCustomerOrThrow(customerId, workshopId);
    if (!existing) {
      return Response.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, phone } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return Response.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return Response.json(
          { error: "Teléfono inválido" },
          { status: 400 },
        );
      }
      try {
        updateData.phone = normalizePhone(phone);
      } catch {
        return Response.json(
          { error: "Ingresá un teléfono argentino válido" },
          { status: 400 },
        );
      }
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
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, customerId))
      .returning();

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating customer:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/customers/[id] ──────────────────────────────────────
// Elimina un cliente (solo si no tiene servicios asociados).
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
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que existe y pertenece al taller
    const existing = await getCustomerOrThrow(customerId, workshopId);
    if (!existing) {
      return Response.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    // Verificar que no tenga servicios asociados
    const serviceCount = await db.$count(
      serviceRecords,
      and(
        eq(serviceRecords.customerId, customerId),
        eq(serviceRecords.workshopId, workshopId),
      ),
    );

    if (serviceCount > 0) {
      return Response.json(
        {
          error:
            "No se puede eliminar el cliente porque tiene servicios asociados",
        },
        { status: 409 },
      );
    }

    await db.delete(customers).where(eq(customers.id, customerId));

    return Response.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
