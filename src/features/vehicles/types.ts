/** Vehículo tal como lo devuelve la API. */
export interface Vehicle {
  id: number;
  workshopId: number;
  customerId: number;
  patente: string;
  brand: string;
  model: string;
  year: number | null;
  currentKm: number | null;
  createdAt: string;
  updatedAt: string;
  /** Nombre del cliente asociado (join). */
  customerName?: string;
}

/** Respuesta paginada de GET /api/vehicles. */
export interface VehicleListResponse {
  items: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Datos mínimos de un cliente para el selector. */
export interface CustomerOption {
  id: number;
  name: string;
  phone: string;
}
