import { headers } from "next/headers";
import { getSessionUser, getWorkshopId } from "@/lib/workshop";
import { db } from "@/lib/db";
import { presaleSignups } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function InteresadosPage() {
  const [sessionUser, workshopId] = await Promise.all([
    getSessionUser(headers()),
    getWorkshopId(headers()),
  ]);

  if (!sessionUser) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver esta página.
      </p>
    );
  }

  const signups = await db
    .select()
    .from(presaleSignups)
    .orderBy(desc(presaleSignups.createdAt));

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Talleres interesados
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {signups.length} taller{signups.length !== 1 ? "es" : ""} en la lista
          de espera
        </p>
      </div>

      {signups.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Taller</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th>Registrado</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {signups.map((s) => (
                <tr
                  key={s.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <Td>{s.workshopName}</Td>
                  <Td>
                    <a
                      href={`mailto:${s.email}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {s.email}
                    </a>
                  </Td>
                  <Td>
                    <a
                      href={`tel:${s.phone}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {s.phone}
                    </a>
                  </Td>
                  <Td className="text-zinc-500">
                    {new Date(s.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-3xl" aria-hidden="true">
            📋
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Todavía no hay talleres en la lista de espera.
          </p>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 ${className ?? ""}`}
    >
      {children}
    </td>
  );
}
