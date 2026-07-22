import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { presaleSignups } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: Request | NextRequest) {
  try {
    const body = await request.json();
    const { workshopName, email, phone } = body;

    // ── Validation ──────────────────────────────────────────────

    if (!workshopName || typeof workshopName !== "string" || workshopName.trim().length === 0) {
      return Response.json(
        { error: "El nombre del taller es obligatorio" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "Ingresá un email válido" },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return Response.json(
        { error: "Ingresá un teléfono válido" },
        { status: 400 }
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
    } catch {
      return Response.json(
        { error: "Ingresá un teléfono válido" },
        { status: 400 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
