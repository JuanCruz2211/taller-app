import { headers } from "next/headers";
import { getWorkshopId } from "@/lib/workshop";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import CustomerForm from "@/features/customers/components/customer-form";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: Props) {
  const workshopId = await getWorkshopId(headers());

  if (!workshopId) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para editar clientes.
      </p>
    );
  }
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    notFound();
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.workshopId, workshopId)))
    .limit(1);

  if (!customer) {
    notFound();
  }

  const customerData = {
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Editar cliente
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Modificá los datos de {customer.name}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CustomerForm customer={customerData} />
      </div>
    </div>
  );
}
