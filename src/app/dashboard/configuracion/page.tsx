import { headers } from "next/headers";
import { getWorkshopId } from "@/lib/workshop";
import { db } from "@/lib/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";
import WorkshopForm from "@/features/workshops/components/workshop-form";
import type { Workshop } from "@/features/workshops/types";

export default async function ConfiguracionPage() {
  const workshopId = await getWorkshopId(headers());

  if (!workshopId) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Tu taller no está configurado. Completá el registro primero.
      </p>
    );
  }

  const [workshop] = await db
    .select()
    .from(workshops)
    .where(eq(workshops.id, workshopId))
    .limit(1);

  if (!workshop) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Taller no encontrado.
      </p>
    );
  }

  const workshopData: Workshop = {
    ...workshop,
    createdAt: workshop.createdAt.toISOString(),
    updatedAt: workshop.updatedAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configuración del taller
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {workshop.name}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <WorkshopForm workshop={workshopData} />
      </div>
    </div>
  );
}
