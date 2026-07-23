import { headers } from "next/headers";
import { getWorkshopId, getSessionUser } from "@/lib/workshop";
import { db } from "@/lib/db";
import { customers, vehicles, serviceRecords } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser(headers());

  if (!sessionUser) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver el panel.
      </p>
    );
  }

  const workshopId = await getWorkshopId(headers());

  if (!workshopId) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Tu taller no está configurado. Completá el registro primero.
      </p>
    );
  }

  const [customerCount, vehicleCount, todayServices] = await Promise.all([
    db.$count(
      customers,
      eq(customers.workshopId, workshopId)
    ),
    db.$count(vehicles, eq(vehicles.workshopId, workshopId)),
    db.$count(
      serviceRecords,
      and(
        eq(serviceRecords.workshopId, workshopId),
        gte(
          serviceRecords.createdAt,
          new Date(new Date().setHours(0, 0, 0, 0))
        )
      )
    ),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Panel de control
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Bienvenido de nuevo, {sessionUser.name}
      </p>

      {/* Stats grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Servicios hoy"
          value={todayServices}
          icon="🔧"
          empty={todayServices === 0}
          emptyMessage="Todavía no hay servicios hoy"
        />

        <StatCard
          title="Clientes"
          value={customerCount}
          icon="👥"
          empty={customerCount === 0}
          emptyMessage="Todavía no tenés clientes"
        />

        <StatCard
          title="Vehículos"
          value={vehicleCount}
          icon="🚗"
          empty={vehicleCount === 0}
          emptyMessage="Todavía no tenés vehículos"
        />
      </div>

      {/* Placeholder for pending reminders */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Próximos vencimientos
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Los recordatorios de services próximos a vencer aparecerán acá.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  empty,
  emptyMessage,
}: {
  title: string;
  value: number;
  icon: string;
  empty: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </p>
      </div>
      {empty ? (
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          {emptyMessage}
        </p>
      ) : (
        <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
      )}
    </div>
  );
}
