"use client";

import { useState, type FormEvent } from "react";

interface FormData {
  workshopName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  workshopName?: string;
  email?: string;
  phone?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.workshopName.trim()) {
    errors.workshopName = "El nombre del taller es obligatorio";
  }

  if (!data.email.trim()) {
    errors.email = "El email es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Ingresá un email válido";
  }

  if (!data.phone.trim()) {
    errors.phone = "El teléfono es obligatorio";
  } else {
    const cleaned = data.phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      errors.phone = "Ingresá un teléfono válido";
    }
  }

  return errors;
}

export default function SignupForm() {
  const [formData, setFormData] = useState<FormData>({
    workshopName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopName: formData.workshopName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al registrarse");
      }

      setStatus("success");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Error del servidor"
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section
        id="signup"
        className="mx-auto max-w-lg px-6 py-20 md:py-28"
      >
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950">
          <div className="mb-4 text-4xl">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
            ¡Registrado!
          </h2>
          <p className="mt-3 text-green-700 dark:text-green-300">
            Te vamos a contactar cuando tengamos novedades. Mientras tanto,
            seguí trabajando como siempre.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="signup"
      className="mx-auto max-w-lg px-6 py-20 md:py-28"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sumá tu taller a la lista
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Dejanos tus datos y te avisamos cuando estemos listos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-5"
        noValidate
      >
        {/* Workshop name */}
        <div>
          <label
            htmlFor="workshopName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Nombre del taller
          </label>
          <input
            id="workshopName"
            type="text"
            value={formData.workshopName}
            onChange={(e) =>
              setFormData({ ...formData, workshopName: e.target.value })
            }
            className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.workshopName
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-300 dark:border-zinc-700"
            } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
            placeholder="Ej: Taller Mecánico Pérez"
          />
          {errors.workshopName && (
            <p className="mt-1 text-sm text-red-600">{errors.workshopName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-300 dark:border-zinc-700"
            } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
            placeholder="taller@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Teléfono
          </label>
          <input
            id="phone"
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

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? (
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
              Enviando…
            </>
          ) : (
            "Anotarme en la lista"
          )}
        </button>
      </form>
    </section>
  );
}
