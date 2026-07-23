"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import type { Vehicle } from "../types";
import type { CustomerOption } from "../types";

interface FormData {
  patente: string;
  brand: string;
  model: string;
  year: string;
  customerId: string;
}

interface FormErrors {
  patente?: string;
  brand?: string;
  model?: string;
  year?: string;
  customerId?: string;
}

interface VehicleFormProps {
  /** Si se proporciona, el formulario edita un vehículo existente. */
  vehicle?: Vehicle;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  const patenteRegexVieja = /^[A-Z]{3}-\d{3}$/;
  const patenteRegexNueva = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
  const patente = data.patente.toUpperCase().trim();
  if (!patente) {
    errors.patente = "La patente es obligatoria";
  } else if (!patenteRegexVieja.test(patente) && !patenteRegexNueva.test(patente)) {
    errors.patente =
      "Formato inválido. Usá ABC-123 o AB-123-CD";
  }

  if (!data.brand.trim()) {
    errors.brand = "La marca es obligatoria";
  }

  if (!data.model.trim()) {
    errors.model = "El modelo es obligatorio";
  }

  if (data.year.trim()) {
    const yearNum = parseInt(data.year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      errors.year = "Ingresá un año válido (ej: 2020)";
    }
  }

  if (!data.customerId) {
    errors.customerId = "Seleccioná un cliente";
  }

  return errors;
}

const PATENTE_PLACEHOLDER = "ABC-123 o AB-123-CD";

export default function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = !!vehicle;

  const [formData, setFormData] = useState<FormData>({
    patente: vehicle?.patente ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year?.toString() ?? "",
    customerId: vehicle?.customerId?.toString() ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer search/selector state
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers("");
  }, []);

  async function fetchCustomers(search: string) {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.items ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingCustomers(false);
    }
  }

  function handleCustomerSearch(value: string) {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    fetchCustomers(value);
  }

  function selectCustomer(customer: CustomerOption) {
    setFormData({ ...formData, customerId: String(customer.id) });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setErrors({ ...errors, customerId: undefined });
  }

  function getSelectedCustomerName(): string {
    if (!formData.customerId) return "";
    const found = customers.find(
      (c) => String(c.id) === formData.customerId,
    );
    return found?.name ?? "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const url = isEditing
        ? `/api/vehicles/${vehicle!.id}`
        : "/api/vehicles";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        patente: formData.patente.toUpperCase().trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        customerId: parseInt(formData.customerId, 10),
      };

      if (formData.year.trim()) {
        body.year = parseInt(formData.year.trim(), 10);
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error del servidor");
      }

      showToast(
        isEditing ? "Vehículo actualizado" : "Vehículo creado",
        "success",
      );
      router.push("/dashboard/vehiculos");
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
      {/* Patente */}
      <div>
        <label
          htmlFor="vehicle-patente"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Patente *
        </label>
        <input
          id="vehicle-patente"
          type="text"
          value={formData.patente}
          onChange={(e) => {
            setFormData({ ...formData, patente: e.target.value.toUpperCase() });
            if (errors.patente) setErrors({ ...errors, patente: undefined });
          }}
          placeholder={PATENTE_PLACEHOLDER}
          maxLength={11}
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.patente
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
        />
        {errors.patente && (
          <p className="mt-1 text-sm text-red-600">{errors.patente}</p>
        )}
      </div>

      {/* Marca */}
      <div>
        <label
          htmlFor="vehicle-brand"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Marca *
        </label>
        <input
          id="vehicle-brand"
          type="text"
          value={formData.brand}
          onChange={(e) =>
            setFormData({ ...formData, brand: e.target.value })
          }
          placeholder="Ej: Toyota"
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.brand
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
        />
        {errors.brand && (
          <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
        )}
      </div>

      {/* Modelo */}
      <div>
        <label
          htmlFor="vehicle-model"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Modelo *
        </label>
        <input
          id="vehicle-model"
          type="text"
          value={formData.model}
          onChange={(e) =>
            setFormData({ ...formData, model: e.target.value })
          }
          placeholder="Ej: Corolla"
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.model
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
        />
        {errors.model && (
          <p className="mt-1 text-sm text-red-600">{errors.model}</p>
        )}
      </div>

      {/* Año */}
      <div>
        <label
          htmlFor="vehicle-year"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Año
        </label>
        <input
          id="vehicle-year"
          type="number"
          value={formData.year}
          onChange={(e) =>
            setFormData({ ...formData, year: e.target.value })
          }
          placeholder="Ej: 2020"
          min={1900}
          max={2100}
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.year
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
        />
        {errors.year && (
          <p className="mt-1 text-sm text-red-600">{errors.year}</p>
        )}
      </div>

      {/* Cliente (selector buscable) */}
      <div className="relative">
        <label
          htmlFor="vehicle-customer"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Cliente *
        </label>
        <input
          id="vehicle-customer"
          type="text"
          value={
            showCustomerDropdown
              ? customerSearch
              : customerSearch || getSelectedCustomerName()
          }
          onFocus={() => {
            setShowCustomerDropdown(true);
            setCustomerSearch("");
          }}
          onChange={(e) => handleCustomerSearch(e.target.value)}
          placeholder="Buscá un cliente…"
          autoComplete="off"
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.customerId
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
        />
        {errors.customerId && (
          <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
        )}

        {/* Dropdown */}
        {showCustomerDropdown && (
          <>
            {/* Overlay to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCustomerDropdown(false)}
            />
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {loadingCustomers && customers.length === 0 && (
                <div className="px-4 py-3 text-sm text-zinc-500">
                  Buscando clientes…
                </div>
              )}
              {!loadingCustomers && customers.length === 0 && (
                <div className="px-4 py-3 text-sm text-zinc-500">
                  No se encontraron clientes
                </div>
              )}
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => selectCustomer(customer)}
                  className="w-full px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-blue-950"
                >
                  <span className="font-medium">{customer.name}</span>
                  <span className="ml-2 text-zinc-400">{customer.phone}</span>
                </button>
              ))}
            </div>
          </>
        )}
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
              {isEditing ? "Guardando…" : "Creando…"}
            </>
          ) : isEditing ? (
            "Guardar cambios"
          ) : (
            "Crear vehículo"
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
