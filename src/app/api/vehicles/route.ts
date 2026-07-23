import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkshopId } from "@/lib/workshop";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vehicles, customers } from "@/db/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { validatePatente } from "@/lib/phone";

// ── GET /api/vehicles ────────────────────────────────────────────────
// Lista paginada de vehículos del taller autenticado.
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

    // Count only from vehicles table
    const total = await db.$count(vehicles, where);

    // Select with join to customers
    const rows = await db
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
      .orderBy(vehicles.patente);

    const items = rows.map((row) => ({
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
    }));

    return Response.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing vehicles:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── POST /api/vehicles ───────────────────────────────────────────────
// Crea un nuevo vehículo.
// Body: { patente, brand, model, year?, customerId }
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
    const { patente, brand, model, year, customerId } = body;

    // ── Validation ────────────────────────────────────────────────

    if (!patente || typeof patente !== "string") {
      return Response.json(
        { error: "La patente es obligatoria" },
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

    if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
      return Response.json(
        { error: "La marca es obligatoria" },
        { status: 400 },
      );
    }

    if (!model || typeof model !== "string" || model.trim().length === 0) {
      return Response.json(
        { error: "El modelo es obligatorio" },
        { status: 400 },
      );
    }

    if (!customerId || typeof customerId !== "number") {
      return Response.json(
        { error: "El cliente es obligatorio" },
        { status: 400 },
      );
    }

    // Verificar que el cliente existe y pertenece al mismo taller
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.workshopId, workshopId)),
      )
      .limit(1);

    if (!customer) {
      return Response.json(
        { error: "El cliente seleccionado no existe" },
        { status: 400 },
      );
    }

    // ── Insert ────────────────────────────────────────────────────

    const patenteNormalized = patente.toUpperCase().trim();

    const [vehicle] = await db
      .insert(vehicles)
      .values({
        workshopId,
        customerId,
        patente: patenteNormalized,
        brand: brand.trim(),
        model: model.trim(),
        year: year ? parseInt(year, 10) : null,
      })
      .returning();

    return Response.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle:", error);

    // PostgreSQL unique constraint violation (duplicate patente)
    if (
      (error as { code?: string }).code === "23505" ||
      (error as { message?: string }).message?.includes("duplicate key") ||
      (error as { constraint?: string }).constraint ===
        "vehicles_patente_per_workshop_unique"
    ) {
      return Response.json(
        { error: "Esta patente ya está registrada para otro vehículo" },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
