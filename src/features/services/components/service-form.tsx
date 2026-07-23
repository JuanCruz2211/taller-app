"use client";

import { useReducer, useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import type {
  ServiceRecord,
  ServiceFormState,
  ServiceFormAction,
  ServiceFormItem,
  CustomerOption,
  VehicleOption,
} from "../types";

// ── Reducer ───────────────────────────────────────────────────────────

let nextTempId = 1;
function generateTempId(): string {
  return `item_${nextTempId++}`;
}

function createEmptyItem(): ServiceFormItem {
  return {
    tempId: generateTempId(),
    description: "",
    partCost: "",
    laborCost: "",
    category: "",
    nextServiceKm: "",
    nextServiceMonths: "",
  };
}

const initialState: ServiceFormState = {
  customerId: "",
  vehicleId: "",
  mechanicName: "",
  kmAtService: "",
  notes: "",
  items: [createEmptyItem()],
};

function serviceFormReducer(
  state: ServiceFormState,
  action: ServiceFormAction,
): ServiceFormState {
  switch (action.type) {
    case "SET_CUSTOMER":
      return { ...state, customerId: action.payload, vehicleId: "" };

    case "SET_VEHICLE":
      return { ...state, vehicleId: action.payload };

    case "SET_MECHANIC_NAME":
      return { ...state, mechanicName: action.payload };

    case "SET_KM":
      return { ...state, kmAtService: action.payload };

    case "SET_NOTES":
      return { ...state, notes: action.payload };

    case "ADD_ITEM":
      return { ...state, items: [...state.items, createEmptyItem()] };

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.tempId !== action.payload),
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.tempId === action.payload.tempId
            ? { ...item, [action.payload.field]: action.payload.value }
            : item,
        ),
      };

    case "RESET":
      return { ...initialState, items: [createEmptyItem()] };

    default:
      return state;
  }
}

// ── Validation ────────────────────────────────────────────────────────

interface FormErrors {
  customerId?: string;
  vehicleId?: string;
  mechanicName?: string;
  kmAtService?: string;
  items?: string;
}

function validate(state: ServiceFormState): FormErrors {
  const errors: FormErrors = {};

  if (!state.customerId) {
    errors.customerId = "Seleccioná un cliente";
  }

  if (!state.vehicleId) {
    errors.vehicleId = "Seleccioná un vehículo";
  }

  if (!state.mechanicName.trim()) {
    errors.mechanicName = "El nombre del mecánico es obligatorio";
  }

  if (!state.kmAtService.trim()) {
    errors.kmAtService = "El kilometraje es obligatorio";
  } else if (isNaN(Number(state.kmAtService))) {
    errors.kmAtService = "Ingresá un número válido";
  }

  const validItems = state.items.filter(
    (item) => item.description.trim().length > 0,
  );
  if (validItems.length === 0) {
    errors.items = "Agregá al menos un item de servicio";
  }

  return errors;
}

// ── Props ─────────────────────────────────────────────────────────────

interface ServiceFormProps {
  service?: ServiceRecord;
}

// ── Component ─────────────────────────────────────────────────────────

export default function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const isEditing = !!service;

  const [state, dispatch] = useReducer(serviceFormReducer, service
    ? {
      customerId: String(service.customerId),
      vehicleId: String(service.vehicleId),
      mechanicName: service.mechanicName,
      kmAtService: String(service.kmAtService),
      notes: service.notes ?? "",
      items: (service.items ?? []).map((item) => ({
        tempId: generateTempId(),
        description: item.description,
        partCost: item.partCost === "0.00" ? "" : item.partCost,
        laborCost: item.laborCost === "0.00" ? "" : item.laborCost,
        category: item.category ?? "",
        nextServiceKm: item.nextServiceKm?.toString() ?? "",
        nextServiceMonths: item.nextServiceMonths?.toString() ?? "",
      })),
    }
    : initialState);

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer selector
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Vehicle selector (filtered by customer)
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Load customers on mount
  useEffect(() => {
    fetchCustomers("");
  }, []);

  // Fetch vehicles when customer changes
  useEffect(() => {
    if (state.customerId) {
      fetchVehiclesByCustomer(state.customerId);
    } else {
      setVehicles([]);
    }
  }, [state.customerId]);

  async function fetchCustomers(search: string) {
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
    }
  }

  async function fetchVehiclesByCustomer(customerId: string) {
    try {
      const res = await fetch(`/api/customers/${customerId}/vehicles`);
      if (res.ok) {
        const json = await res.json();
        setVehicles(json.items ?? []);
      }
    } catch {
      // Silently fail
    }
  }

  function handleCustomerSearch(value: string) {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    fetchCustomers(value);
  }

  function selectCustomer(customer: CustomerOption) {
    dispatch({ type: "SET_CUSTOMER", payload: String(customer.id) });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setVehicleSearch("");
    setErrors((prev) => ({ ...prev, customerId: undefined }));
  }

  function getSelectedCustomerName(): string {
    if (!state.customerId) return "";
    const found = customers.find((c) => String(c.id) === state.customerId);
    return found?.name ?? "";
  }

  function handleVehicleSearch(value: string) {
    setVehicleSearch(value);
    setShowVehicleDropdown(true);
  }

  function selectVehicle(vehicle: VehicleOption) {
    dispatch({ type: "SET_VEHICLE", payload: String(vehicle.id) });
    setVehicleSearch(`${vehicle.patente} — ${vehicle.brand} ${vehicle.model}`);
    setShowVehicleDropdown(false);
    setErrors((prev) => ({ ...prev, vehicleId: undefined }));
  }

  function getSelectedVehicleLabel(): string {
    if (!state.vehicleId) return "";
    const found = vehicles.find((v) => String(v.id) === state.vehicleId);
    return found ? `${found.patente} — ${found.brand} ${found.model}` : "";
  }

  // ── Submit ──────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(state);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const url = isEditing
        ? `/api/services/${service!.id}`
        : "/api/services";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        mechanicName: state.mechanicName.trim(),
        kmAtService: parseInt(state.kmAtService, 10),
        customerId: parseInt(state.customerId, 10),
        vehicleId: parseInt(state.vehicleId, 10),
        notes: state.notes.trim() || null,
        items: state.items
          .filter((item) => item.description.trim().length > 0)
          .map((item) => ({
            description: item.description.trim(),
            partCost: item.partCost || "0",
            laborCost: item.laborCost || "0",
            category: item.category.trim() || null,
            nextServiceKm: item.nextServiceKm || null,
            nextServiceMonths: item.nextServiceMonths || null,
          })),
      };

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
        isEditing ? "Servicio actualizado" : "Servicio creado",
        "success",
      );
      router.push("/dashboard/servicios");
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Error del servidor",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────

  function itemTotal(item: ServiceFormItem): string {
    const part = parseFloat(item.partCost) || 0;
    const labor = parseFloat(item.laborCost) || 0;
    return (part + labor).toFixed(2);
  }

  function formTotal(): string {
    return state.items
      .reduce((acc, item) => {
        const part = parseFloat(item.partCost) || 0;
        const labor = parseFloat(item.laborCost) || 0;
        return acc + part + labor;
      }, 0)
      .toFixed(2);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── Cliente (selector buscable) ─────────────────────────── */}
      <div className="relative">
        <label
          htmlFor="service-customer"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Cliente *
        </label>
        <input
          id="service-customer"
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

        {showCustomerDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCustomerDropdown(false)}
            />
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {customers.length === 0 && (
                <div className="px-4 py-3 text-sm text-zinc-500">
                  {customerSearch.trim()
                    ? "No se encontraron clientes"
                    : "Cargando clientes…"}
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

      {/* ── Vehículo (filtrado por cliente) ─────────────────────── */}
      <div className="relative">
        <label
          htmlFor="service-vehicle"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Vehículo *
        </label>
        <input
          id="service-vehicle"
          type="text"
          value={
            showVehicleDropdown
              ? vehicleSearch
              : vehicleSearch || getSelectedVehicleLabel()
          }
          onFocus={() => {
            if (state.customerId) {
              setShowVehicleDropdown(true);
              setVehicleSearch("");
            }
          }}
          onChange={(e) => handleVehicleSearch(e.target.value)}
          placeholder={
            state.customerId
              ? "Seleccioná un vehículo…"
              : "Primero seleccioná un cliente"
          }
          autoComplete="off"
          disabled={!state.customerId}
          className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.vehicleId
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
        />
        {errors.vehicleId && (
          <p className="mt-1 text-sm text-red-600">{errors.vehicleId}</p>
        )}

        {showVehicleDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowVehicleDropdown(false)}
            />
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {vehicles.length === 0 && (
                <div className="px-4 py-3 text-sm text-zinc-500">
                  Este cliente no tiene vehículos registrados
                </div>
              )}
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => selectVehicle(vehicle)}
                  className="w-full px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-blue-950"
                >
                  <span className="font-medium">{vehicle.patente}</span>
                  <span className="ml-2 text-zinc-400">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Mecánico y KM ────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="service-mechanic"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mecánico *
          </label>
          <input
            id="service-mechanic"
            type="text"
            value={state.mechanicName}
            onChange={(e) =>
              dispatch({
                type: "SET_MECHANIC_NAME",
                payload: e.target.value,
              })
            }
            placeholder="Nombre del mecánico"
            className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.mechanicName
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-300 dark:border-zinc-700"
            } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
          />
          {errors.mechanicName && (
            <p className="mt-1 text-sm text-red-600">{errors.mechanicName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="service-km"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            KM en servicio *
          </label>
          <input
            id="service-km"
            type="number"
            value={state.kmAtService}
            onChange={(e) =>
              dispatch({ type: "SET_KM", payload: e.target.value })
            }
            placeholder="Ej: 50000"
            className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.kmAtService
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-300 dark:border-zinc-700"
            } bg-white dark:bg-zinc-900 dark:text-zinc-100`}
          />
          {errors.kmAtService && (
            <p className="mt-1 text-sm text-red-600">{errors.kmAtService}</p>
          )}
        </div>
      </div>

      {/* ── Notas ────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="service-notes"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Notas / Descripción
        </label>
        <textarea
          id="service-notes"
          value={state.notes}
          onChange={(e) =>
            dispatch({ type: "SET_NOTES", payload: e.target.value })
          }
          placeholder="Comentarios adicionales sobre el servicio…"
          rows={2}
          className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* ── Items dinámicos ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Items de servicio *
          </label>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_ITEM" })}
            className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            + Agregar item
          </button>
        </div>

        {errors.items && (
          <p className="mt-2 text-sm text-red-600">{errors.items}</p>
        )}

        <div className="mt-3 space-y-4">
          {state.items.map((item, index) => (
            <div
              key={item.tempId}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Item #{index + 1}
                </span>
                {state.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "REMOVE_ITEM", payload: item.tempId })
                    }
                    className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    aria-label="Eliminar item"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ITEM",
                        payload: {
                          tempId: item.tempId,
                          field: "description",
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="Descripción del item (ej: Cambio de aceite)"
                    className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Repuestos ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.partCost}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ITEM",
                        payload: {
                          tempId: item.tempId,
                          field: "partCost",
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Mano de obra ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.laborCost}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ITEM",
                        payload: {
                          tempId: item.tempId,
                          field: "laborCost",
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Categoría
                      </label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_ITEM",
                            payload: {
                              tempId: item.tempId,
                              field: "category",
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder="Ej: Motor, Transmisión"
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Próx. service (km)
                      </label>
                      <input
                        type="number"
                        value={item.nextServiceKm}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_ITEM",
                            payload: {
                              tempId: item.tempId,
                              field: "nextServiceKm",
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder="—"
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Próx. service (meses)
                      </label>
                      <input
                        type="number"
                        value={item.nextServiceMonths}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_ITEM",
                            payload: {
                              tempId: item.tempId,
                              field: "nextServiceMonths",
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder="—"
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-zinc-500">
                    Total item:{" "}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      ${parseFloat(itemTotal(item)).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total general */}
        {state.items.filter((i) => i.description.trim()).length > 0 && (
          <div className="mt-4 text-right">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Total estimado:{" "}
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${parseFloat(formTotal()).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── Server error ─────────────────────────────────────────── */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {serverError}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
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
            "Crear servicio"
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
