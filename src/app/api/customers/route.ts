import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkshopId } from "@/lib/workshop";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";

// ── GET /api/customers ──────────────────────────────────────────────
// Lista paginada de clientes del taller autenticado.
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
    const baseConditions = [eq(customers.workshopId, workshopId)];

    if (search.trim()) {
      baseConditions.push(
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        or(
          ilike(customers.name, `%${search.trim()}%`),
          ilike(customers.phone, `%${search.trim()}%`),
        )!,
      );
    }

    const where = and(...baseConditions);

    const [total, items] = await Promise.all([
      db.$count(customers, where),
      db
        .select()
        .from(customers)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(customers.name),
    ]);

    return Response.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing customers:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── POST /api/customers ─────────────────────────────────────────────
// Crea un nuevo cliente.
// Body: { name: string, phone: string }
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
    const { name, phone } = body;

    // ── Validation ────────────────────────────────────────────────

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "El nombre del cliente es obligatorio" },
        { status: 400 },
      );
    }

    if (!phone || typeof phone !== "string") {
      return Response.json(
        { error: "El teléfono es obligatorio" },
        { status: 400 },
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
    } catch {
      return Response.json(
        { error: "Ingresá un teléfono argentino válido (ej: 11 4455-6677)" },
        { status: 400 },
      );
    }

    // ── Insert ────────────────────────────────────────────────────

    const [customer] = await db
      .insert(customers)
      .values({
        workshopId,
        name: name.trim(),
        phone: normalizedPhone,
      })
      .returning();

    return Response.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
