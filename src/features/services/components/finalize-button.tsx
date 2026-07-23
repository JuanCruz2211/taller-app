"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FinalizeButtonProps {
  serviceId: number;
}

export default function FinalizeButton({ serviceId }: FinalizeButtonProps) {
  const router = useRouter();
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");

  async function handleFinalize() {
    if (
      !confirm(
        "¿Estás seguro de querer finalizar este servicio? No se podrá modificar después.",
      )
    ) {
      return;
    }

    setFinalizing(true);
    setError("");

    try {
      const res = await fetch(`/api/services/${serviceId}/finalize`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al finalizar");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error del servidor");
      setFinalizing(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleFinalize}
        disabled={finalizing}
        className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {finalizing ? "Finalizando…" : "Finalizar servicio"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
