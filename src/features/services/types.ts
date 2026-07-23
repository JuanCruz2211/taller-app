import type { customers, vehicles } from "@/db/schema";

/** Item de service record tal como lo devuelve la API. */
export interface ServiceRecordItem {
  id: number;
  serviceRecordId: number;
  description: string;
  category: string | null;
  partCost: string;
  laborCost: string;
  nextServiceKm: number | null;
  nextServiceMonths: number | null;
  sortOrder: number;
}

/** Service record tal como lo devuelve la API. */
export interface ServiceRecord {
  id: number;
  workshopId: number;
  vehicleId: number;
  customerId: number;
  mechanicName: string;
  kmAtService: number;
  date: string;
  status: "draft" | "finalized";
  totalCost: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  vehiclePatente?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number | null;
  items?: ServiceRecordItem[];
}

/** Respuesta paginada de GET /api/services. */
export interface ServiceListResponse {
  items: ServiceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Cliente mínimo para selector. */
export interface CustomerOption {
  id: number;
  name: string;
  phone: string;
}

/** Vehículo mínimo para selector. */
export interface VehicleOption {
  id: number;
  patente: string;
  brand: string;
  model: string;
}

/** Item dinámico del formulario (useReducer). */
export interface ServiceFormItem {
  tempId: string;
  description: string;
  partCost: string;
  laborCost: string;
  category: string;
  nextServiceKm: string;
  nextServiceMonths: string;
}

/** Estado completo del formulario de servicio (useReducer). */
export interface ServiceFormState {
  customerId: string;
  vehicleId: string;
  mechanicName: string;
  kmAtService: string;
  notes: string;
  items: ServiceFormItem[];
}

export type ServiceFormAction =
  | { type: "SET_CUSTOMER"; payload: string }
  | { type: "SET_VEHICLE"; payload: string }
  | { type: "SET_MECHANIC_NAME"; payload: string }
  | { type: "SET_KM"; payload: string }
  | { type: "SET_NOTES"; payload: string }
  | { type: "ADD_ITEM" }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_ITEM"; payload: { tempId: string; field: string; value: string } }
  | { type: "RESET" };
