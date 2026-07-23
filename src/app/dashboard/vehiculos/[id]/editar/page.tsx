import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import VehicleForm from "@/features/vehicles/components/vehicle-form";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarVehiculoPage({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para editar vehículos.
      </p>
    );
  }

  const workshopId = Number(session.user.id);
  const { id } = await params;
  const vehicleId = parseInt(id, 10);

  if (isNaN(vehicleId)) {
    notFound();
  }

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(
      and(eq(vehicles.id, vehicleId), eq(vehicles.workshopId, workshopId)),
    )
    .limit(1);

  if (!vehicle) {
    notFound();
  }

  const vehicleData = {
    ...vehicle,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Editar vehículo
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Modificá los datos de {vehicle.patente}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <VehicleForm vehicle={vehicleData} />
      </div>
    </div>
  );
}
