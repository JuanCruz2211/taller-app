/** Taller tal como lo devuelve la API. */
export interface Workshop {
  id: number;
  name: string;
  phone: string;
  cuit: string | null;
  address: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Datos enviados para actualizar el taller. */
export interface WorkshopUpdateData {
  name: string;
  phone: string;
  cuit?: string | null;
  address?: string | null;
}
