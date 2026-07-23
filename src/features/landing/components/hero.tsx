import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center md:py-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
          El service de tu auto,{" "}
          <span className="text-blue-600 dark:text-blue-400">digital</span>
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-zinc-600 md:text-xl dark:text-zinc-400">
          Gestioná los servicios de tu taller desde un solo lugar. Presupuestos
          profesionales en PDF, historial completo de cada vehículo, y
          recordatorios automáticos para tus clientes.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="#signup"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Sumá tu taller
          </Link>

          <Link
            href="#features"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 text-base font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Conocé más
          </Link>
        </div>
      </div>
    </section>
  );
}
