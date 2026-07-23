import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { serviceRecords, serviceItems } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// ── POST /api/services/[id]/finalize ──────────────────────────────────
// Finaliza un service record: cambia status a "finalized".
// Solo se puede finalizar si está en "draft".
export async function POST(
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
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que existe y pertenece al taller
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
      return Response.json(
        { error: "Service no encontrado" },
        { status: 404 },
      );
    }

    if (record.status === "finalized") {
      return Response.json(
        { error: "El servicio ya está finalizado" },
        { status: 409 },
      );
    }

    // Recalcular totalCost desde los items si no se calculó antes
    const items = await db
      .select()
      .from(serviceItems)
      .where(eq(serviceItems.serviceRecordId, serviceId))
      .orderBy(asc(serviceItems.sortOrder));

    // Calcular total
    const totalCost = items.reduce((acc, item) => {
      const part = parseFloat(item.partCost) || 0;
      const labor = parseFloat(item.laborCost) || 0;
      return acc + part + labor;
    }, 0);

    // Actualizar status y totalCost
    const [updated] = await db
      .update(serviceRecords)
      .set({
        status: "finalized",
        totalCost: totalCost.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(serviceRecords.id, serviceId))
      .returning();

    return Response.json(updated);
  } catch (error) {
    console.error("Error finalizing service:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
