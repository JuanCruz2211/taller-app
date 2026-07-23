import { headers } from "next/headers";
import { getWorkshopId } from "@/lib/workshop";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import CustomerList from "@/features/customers/components/customer-list";
import type { CustomerListResponse } from "@/features/customers/types";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ClientesPage({ searchParams }: Props) {
  const workshopId = await getWorkshopId(headers());

  if (!workshopId) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Iniciá sesión para ver los clientes.
      </p>
    );
  }
  const sp = await searchParams;
  const search = sp.search ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const baseConditions = [eq(customers.workshopId, workshopId)];

  if (search.trim()) {
    baseConditions.push(
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      or(
        ilike(customers.name, `%${search.trim()}%`),
        ilike(customers.phone, `%${search.trim()}%`),
      )!,
    );
  }

  const where = and(...baseConditions);

  const [total, items] = await Promise.all([
    db.$count(customers, where),
    db
      .select()
      .from(customers)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(customers.name),
  ]);

  const initialData: CustomerListResponse = {
    items: items.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Administrá los clientes de tu taller
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CustomerList initialData={initialData} />
      </div>
    </div>
  );
}
