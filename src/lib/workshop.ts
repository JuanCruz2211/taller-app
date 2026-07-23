import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Lookup the workshop ID from the authenticated user's email.
 * Pass `await headers()` from the calling server component.
 */
export async function getWorkshopId(
  headersPromise: Headers | Promise<Headers>
): Promise<number | null> {
  const session = await auth.api.getSession({
    headers: await headersPromise,
  });

  if (!session?.user?.email) return null;

  const [workshop] = await db
    .select({ id: workshops.id })
    .from(workshops)
    .where(eq(workshops.email, session.user.email));

  return workshop?.id ?? null;
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
