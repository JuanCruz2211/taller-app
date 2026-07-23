"use client";

import { useState } from "react";

interface ShareButtonProps {
  serviceId: number;
  customerPhone: string | null;
  workshopName: string;
  vehiclePatente: string;
}

/**
 * Botón para compartir un reporte de servicio via WhatsApp.
 *
 * Si el cliente tiene teléfono guardado, genera un link wa.me directo.
 * Si no, muestra un prompt para que el mecánico ingrese el número manualmente.
 */
export default function ShareButton({
  serviceId,
  customerPhone,
  workshopName,
  vehiclePatente,
}: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);

    const reportUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/reports/${serviceId}`
        : "";

    const message = encodeURIComponent(
      `📋 *${workshopName}* — Reporte de Servicio #${serviceId}\n\n` +
        `Vehículo: ${vehiclePatente}\n\n` +
        `Descargá el detalle completo acá:\n${reportUrl}`,
    );

    // Si el cliente tiene teléfono, abrir wa.me directo
    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
      setSharing(false);
      return;
    }

    // Si no hay teléfono, intentar Web Share API primero
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reporte #${serviceId} - ${workshopName}`,
          text: `Mirá el reporte de servicio de ${vehiclePatente}`,
          url: reportUrl,
        });
      } catch {
        // User cancelled or error — fallback to manual entry
        promptForPhone(message);
      }
    } else {
      // No Web Share API — prompt manual entry
      promptForPhone(message);
    }

    setSharing(false);
  }

  function promptForPhone(message: string) {
    const phone = prompt(
      "El cliente no tiene teléfono guardado. Ingresá el número para enviarle el reporte por WhatsApp:",
    );

    if (phone) {
      const clean = phone.replace(/\D/g, "");
      if (clean.length >= 10) {
        window.open(
          `https://wa.me/${clean}?text=${message}`,
          "_blank",
        );
      } else {
        alert("Número inválido. Asegurate de incluir el código de área.");
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      {sharing ? "Compartiendo…" : "Compartir por WhatsApp"}
    </button>
  );
}
