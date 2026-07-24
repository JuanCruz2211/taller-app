import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkshopId } from "@/lib/workshop";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";

// ── HELPERS ─────────────────────────────────────────────────────────

function cleanCuit(value: string): string {
  return value.replace(/\D/g, "");
}

function validateUpdate(body: unknown): {
  valid: boolean;
  name?: string;
  phone?: string;
  cuit?: string | null;
  address?: string | null;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Cuerpo inválido" };
  }

  const data = body as Record<string, unknown>;

  if (typeof data.name !== "string" || !data.name.trim()) {
    return { valid: false, error: "El nombre del taller es obligatorio" };
  }

  if (typeof data.phone !== "string" || !data.phone.trim()) {
    return { valid: false, error: "El teléfono es obligatorio" };
  }

  // Normalize phone (throws on invalid)
  try {
    normalizePhone(data.phone);
  } catch {
    return { valid: false, error: "Teléfono inválido. Ingresá un número argentino válido." };
  }

  const name = data.name.trim();
  const phone = data.phone.trim();
  const cuit =
    data.cuit !== undefined && data.cuit !== null
      ? cleanCuit(String(data.cuit))
      : null;

  return { valid: true, name, phone, cuit };
}

// ── GET /api/workshops ───────────────────────────────────────────────
// Obtiene los datos del taller del usuario autenticado.

export async function GET() {
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

    const [workshop] = await db
      .select()
      .from(workshops)
      .where(eq(workshops.id, workshopId))
      .limit(1);

    if (!workshop) {
      return Response.json({ error: "Taller no encontrado" }, { status: 404 });
    }

    return Response.json(workshop);
  } catch (err) {
    console.error("Error fetching workshop:", err);
    return Response.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// ── PUT /api/workshops ───────────────────────────────────────────────
// Actualiza los datos del taller del usuario autenticado.

export async function PUT(request: NextRequest) {
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
    const validation = validateUpdate(body);

    if (!validation.valid) {
      return Response.json(
        { error: validation.error ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      name: validation.name,
      phone: normalizePhone(validation.phone!),
      updatedAt: new Date(),
    };

    if (validation.cuit !== undefined) {
      updateData.cuit = validation.cuit || null;
    }

    if (body.address !== undefined) {
      updateData.address = typeof body.address === "string" ? body.address.trim() || null : null;
    }

    await db
      .update(workshops)
      .set(updateData)
      .where(eq(workshops.id, workshopId));

    // Return the updated workshop
    const [updated] = await db
      .select()
      .from(workshops)
      .where(eq(workshops.id, workshopId))
      .limit(1);

    return Response.json(updated);
  } catch (err) {
    console.error("Error updating workshop:", err);
    return Response.json({ error: "Error del servidor" }, { status: 500 });
  }
}
