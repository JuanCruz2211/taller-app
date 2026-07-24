import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { presaleSignups } from "@/db/schema";
import { desc } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";

// ── GET /api/signup ──────────────────────────────────────────────────
// Lista todos los presale signups (solo usuarios autenticados).

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const signups = await db
      .select()
      .from(presaleSignups)
      .orderBy(desc(presaleSignups.createdAt));

    return Response.json(signups);
  } catch (error) {
    console.error("Error fetching signups:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── POST /api/signup ─────────────────────────────────────────────────
// Registro público de talleres interesados (presale).

export async function POST(request: Request | NextRequest) {
  try {
    const body = await request.json();
    const { workshopName, email, phone } = body;

    // ── Validation ──────────────────────────────────────────────

    if (
      !workshopName ||
      typeof workshopName !== "string" ||
      workshopName.trim().length === 0
    ) {
      return Response.json(
        { error: "El nombre del taller es obligatorio" },
        { status: 400 },
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        { error: "Ingresá un email válido" },
        { status: 400 },
      );
    }

    if (!phone || typeof phone !== "string") {
      return Response.json(
        { error: "Ingresá un teléfono válido" },
        { status: 400 },
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
    } catch {
      return Response.json(
        { error: "Ingresá un teléfono válido" },
        { status: 400 },
      );
    }

    // ── Insert ──────────────────────────────────────────────────

    await db.insert(presaleSignups).values({
      workshopName: workshopName.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
    });

    return Response.json(
      { message: "Registrado en la lista de espera" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
