const features = [
  {
    title: "Presupuestos PDF profesionales",
    description:
      "Generá presupuestos y órdenes de servicio con la marca de tu taller. Descargalos en PDF y compartilos al instante.",
    icon: "📄",
  },
  {
    title: "WhatsApp directo",
    description:
      "Enviale el presupuesto a tu cliente por WhatsApp con un solo toque. Sin archivos pesados, sin vueltas.",
    icon: "💬",
  },
  {
    title: "Historial digital completo",
    description:
      "Cada service queda registrado. Consultá el historial por patente o por cliente al instante.",
    icon: "📋",
  },
  {
    title: "Recordatorios inteligentes",
    description:
      "Sabé cuándo a cada vehículo le toca el próximo service. Nunca más se te va a pasar.",
    icon: "🔔",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-6 py-20 md:py-28"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
          Todo lo que tu taller necesita
        </h2>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Una herramienta pensada para el mecánico argentino. Simple, rápida y
          sin complicaciones.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="mb-4 text-3xl" aria-hidden="true">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
