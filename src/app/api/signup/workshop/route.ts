import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workshops } from "@/db/schema";
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
    const { name, email, phone } = body;

    if (!name || !email || !phone) {
      return Response.json(
        { error: "Faltan datos: name, email y phone son obligatorios" },
        { status: 400 }
      );
    }

    // Create workshop entry
    const [workshop] = await db
      .insert(workshops)
      .values({
        name,
        email,
        passwordHash: "", // Password is managed by Better Auth
        phone,
      })
      .returning({ id: workshops.id });

    // Link the user to the workshop
    const { error } = await auth.api.updateUser({
      headers: request.headers,
      body: {
        userId: session.user.id,
        workshopId: workshop.id,
      },
    });

    if (error) {
      console.error("Failed to link workshop to user:", error);
      // Clean up: delete the orphan workshop
      await db.delete(workshops).where(eq(workshops.id, workshop.id));
      return Response.json(
        { error: "Error al vincular el taller con el usuario" },
        { status: 500 }
      );
    }

    return Response.json({ workshopId: workshop.id }, { status: 201 });
  } catch (error) {
    console.error("Workshop signup error:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
