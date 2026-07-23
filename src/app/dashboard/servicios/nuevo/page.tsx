import ServiceForm from "@/features/services/components/service-form";

export default function NuevoServicioPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Nuevo servicio
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Registrá un nuevo servicio en tu taller
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ServiceForm />
      </div>
    </div>
  );
}
