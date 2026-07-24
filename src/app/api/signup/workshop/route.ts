import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workshops, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return Response.json(
        { error: "Faltan datos: name y phone son obligatorios" },
        { status: 400 }
      );
    }

    // Create workshop entry
    const [workshop] = await db
      .insert(workshops)
      .values({
        name,
        phone,
      })
      .returning({ id: workshops.id });

    // Link user to the new workshop
    await db
      .update(user)
      .set({ workshopId: workshop.id })
      .where(eq(user.id, session.user.id));

    return Response.json({ workshopId: workshop.id }, { status: 201 });
  } catch (error) {
    console.error("Workshop signup error:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
