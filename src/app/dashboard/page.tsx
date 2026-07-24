import { headers } from "next/headers";
import Link from "next/link";
import { getWorkshopId, getSessionUser } from "@/lib/workshop";
import { db } from "@/lib/db";
import { customers, vehicles, serviceRecords, serviceItems } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { buildReminderList } from "@/lib/reminders";

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
    db.$count(customers, eq(customers.workshopId, workshopId)),
    db.$count(vehicles, eq(vehicles.workshopId, workshopId)),
    db.$count(
      serviceRecords,
      and(
        eq(serviceRecords.workshopId, workshopId),
        gte(serviceRecords.createdAt, new Date(new Date().setHours(0, 0, 0, 0))),
      ),
    ),
  ]);

  // --- upcoming service reminders ---

  const [kmReminders, dateReminders] = await Promise.all([
    // Items cuyo próximo service por km está cerca (±5000 km)
    db
      .select({
        id: serviceItems.id,
        description: serviceItems.description,
        nextServiceKm: serviceItems.nextServiceKm,
        currentKm: vehicles.currentKm,
        serviceDate: serviceRecords.date,
        serviceRecordId: serviceItems.serviceRecordId,
        vehiclePatente: vehicles.patente,
        vehicleBrand: vehicles.brand,
        vehicleModel: vehicles.model,
        vehicleId: vehicles.id,
        customerName: customers.name,
      })
      .from(serviceItems)
      .innerJoin(serviceRecords, eq(serviceItems.serviceRecordId, serviceRecords.id))
      .innerJoin(vehicles, eq(serviceRecords.vehicleId, vehicles.id))
      .innerJoin(customers, eq(serviceRecords.customerId, customers.id))
      .where(
        and(
          eq(serviceRecords.workshopId, workshopId),
          eq(serviceRecords.status, "finalized"),
          sql`${serviceItems.nextServiceKm} IS NOT NULL`,
          sql`${vehicles.currentKm} IS NOT NULL`,
          sql`${vehicles.currentKm} >= ${serviceItems.nextServiceKm} - 5000`,
          sql`${vehicles.currentKm} <= ${serviceItems.nextServiceKm} + 5000`,
        ),
      )
      .orderBy(sql`${serviceItems.nextServiceKm} - ${vehicles.currentKm}`),

    // Items cuyo próximo service por fecha está dentro del próximo mes
    db
      .select({
        id: serviceItems.id,
        description: serviceItems.description,
        serviceDate: serviceRecords.date,
        nextServiceMonths: serviceItems.nextServiceMonths,
        serviceRecordId: serviceItems.serviceRecordId,
        vehiclePatente: vehicles.patente,
        vehicleBrand: vehicles.brand,
        vehicleModel: vehicles.model,
        vehicleId: vehicles.id,
        customerName: customers.name,
      })
      .from(serviceItems)
      .innerJoin(serviceRecords, eq(serviceItems.serviceRecordId, serviceRecords.id))
      .innerJoin(vehicles, eq(serviceRecords.vehicleId, vehicles.id))
      .innerJoin(customers, eq(serviceRecords.customerId, customers.id))
      .where(
        and(
          eq(serviceRecords.workshopId, workshopId),
          eq(serviceRecords.status, "finalized"),
          sql`${serviceItems.nextServiceMonths} IS NOT NULL`,
          sql`${serviceRecords.date} + (${serviceItems.nextServiceMonths} || ' months')::interval
            BETWEEN CURRENT_DATE - interval '30 days'
            AND CURRENT_DATE + interval '30 days'`,
        ),
      )
      .orderBy(
        sql`${serviceRecords.date} + (${serviceItems.nextServiceMonths} || ' months')::interval`,
      ),
  ]);

  const reminders = buildReminderList(kmReminders, dateReminders);

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

      {/* Upcoming reminders */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Próximos vencimientos
        </h2>

        {reminders.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {reminders.map((r) => (
              <li key={`${r.type}-${r.id}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {/* Urgency indicator */}
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      r.isOverdue
                        ? "bg-red-500"
                        : r.isClose
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                    }`}
                    aria-hidden="true"
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {r.description}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {r.customerName} · {r.vehicleBrand} {r.vehicleModel} · {r.vehiclePatente}
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {r.urgencyLabel}
                    </p>
                  </div>

                  {/* Link */}
                  <Link
                    href={`/dashboard/vehiculos/${r.vehicleId}`}
                    className="shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    Ver vehículo →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No hay vencimientos próximos.
          </p>
        )}
      </div>
    </div>
  );
}

// --- Stat card component ---

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

// --- Reminder logic lives in src/lib/reminders.ts ---
