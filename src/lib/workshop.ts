import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Lookup the workshop ID from the authenticated user.
 * Pass `await headers()` from the calling server component.
 */
export async function getWorkshopId(
  headersPromise: Headers | Promise<Headers>
): Promise<number | null> {
  const session = await auth.api.getSession({
    headers: await headersPromise,
  });

  if (!session?.user?.id) return null;

  const [dbUser] = await db
    .select({ workshopId: user.workshopId })
    .from(user)
    .where(eq(user.id, session.user.id));

  return dbUser?.workshopId ?? null;
}

/**
 * Get the current session user.
 */
export async function getSessionUser(
  headersPromise: Headers | Promise<Headers>
) {
  const session = await auth.api.getSession({
    headers: await headersPromise,
  });
  return session?.user ?? null;
}
