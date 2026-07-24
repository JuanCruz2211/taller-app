"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import type { Workshop } from "../types";

interface FormData {
  name: string;
  phone: string;
  cuit: string;
  address: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  cuit?: string;
  address?: string;
}

function cleanPhone(value: string): string {
  return value.replace(/\D/g, "");
}

function cleanCuit(value: string): string {
  return value.replace(/\D/g, "");
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "El nombre del taller es obligatorio";
  }

  if (!data.phone.trim()) {
    errors.phone = "El teléfono es obligatorio";
  } else {
    const cleaned = cleanPhone(data.phone);
    if (cleaned.length < 10) {
      errors.phone = "Ingresá un teléfono válido de al menos 10 dígitos";
    }
  }

  if (data.cuit.trim()) {
    const cleaned = cleanCuit(data.cuit);
    if (cleaned.length !== 11) {
      errors.cuit = "El CUIT debe tener 11 dígitos (ej: 20-12345678-9)";
    }
  }

  return errors;
}

export default function WorkshopForm({ workshop }: { workshop: Workshop }) {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: workshop.name,
    phone: workshop.phone,
    cuit: workshop.cuit ?? "",
    address: workshop.address ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/workshops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          cuit: formData.cuit.trim() || null,
          address: formData.address.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error del servidor");
      }

      showToast("Taller actualizado", "success");
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Error del servidor",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Nombre */}
      <div>
        <label
          htmlFor="workshop-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nombre del taller *
        </label>
        <input
          id="workshop-name"
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
          placeholder="Ej: Taller Mecánico Pérez"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label
          htmlFor="workshop-phone"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Teléfono *
        </label>
        <input
          id="workshop-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
          placeholder="11 4455-6677"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* CUIT */}
      <div>
        <label
          htmlFor="workshop-cuit"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          CUIT
        </label>
        <input
          id="workshop-cuit"
          type="text"
          value={formData.cuit}
          onChange={(e) =>
            setFormData({ ...formData, cuit: e.target.value })
          }
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.cuit
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
          placeholder="20-12345678-9"
        />
        {errors.cuit && (
          <p className="mt-1 text-sm text-red-600">{errors.cuit}</p>
        )}
        {!errors.cuit && (
          <p className="mt-1 text-xs text-zinc-400">
            Opcional. Usado para facturación.
          </p>
        )}
      </div>

      {/* Dirección */}
      <div>
        <label
          htmlFor="workshop-address"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Dirección
        </label>
        <input
          id="workshop-address"
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="Av. Siempre Viva 123"
        />
        <p className="mt-1 text-xs text-zinc-400">Opcional.</p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {serverError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg
                className="-ml-1 mr-2 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Guardando…
            </>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>
    </form>
  );
}
