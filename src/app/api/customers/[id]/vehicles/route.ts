import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ── GET /api/customers/[id]/vehicles ──────────────────────────────────
// Lista de vehículos de un cliente específico del taller autenticado.
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
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return Response.json({ error: "ID de cliente inválido" }, { status: 400 });
    }

    const items = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.customerId, customerId),
          eq(vehicles.workshopId, workshopId),
        ),
      )
      .orderBy(vehicles.patente);

    return Response.json({ items });
  } catch (error) {
    console.error("Error listing customer vehicles:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
