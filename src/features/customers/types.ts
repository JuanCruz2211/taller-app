/** Cliente tal como lo devuelve la API. */
export interface Customer {
  id: number;
  workshopId: number;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta paginada de GET /api/customers. */
export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
