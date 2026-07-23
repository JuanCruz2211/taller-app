import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../../[id]/route";

// ── Mocks ───────────────────────────────────────────────────────────

const mockSession = vi.hoisted(() => ({
  session: {
    id: "sess_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "1",
    expiresAt: new Date(Date.now() + 86400_000),
    token: "tok_xxx",
  },
  user: {
    id: "1",
    name: "Taller Test",
    email: "test@taller.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}));

const mockDb = vi.hoisted(() => ({
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  $count: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

// Import the mocked auth
import { auth } from "@/lib/auth";

// ── Helpers ─────────────────────────────────────────────────────────

function createRequest(
  url: string,
  method: string,
  body?: unknown,
): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  } as any);
}

const mockRecord = {
  id: 1,
  workshopId: 1,
  vehicleId: 1,
  customerId: 1,
  mechanicName: "Carlos",
  kmAtService: 50000,
  date: new Date("2025-01-01"),
  status: "draft" as const,
  totalCost: "150.00",
  notes: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  customerName: "Juan Pérez",
  customerPhone: "+5491144556677",
  vehiclePatente: "ABC-123",
  vehicleBrand: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
};

const mockItems = [
  {
    id: 1,
    serviceRecordId: 1,
    description: "Cambio de aceite",
    category: null,
    partCost: "100.00",
    laborCost: "50.00",
    nextServiceKm: null,
    nextServiceMonths: null,
    sortOrder: 0,
  },
];

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/services/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/services/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is not a number", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/services/abc"),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when service not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/services/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Service no encontrado");
  });

  it("returns service with items on success", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    // First limit: service record with joins
    mockDb.limit.mockResolvedValueOnce([mockRecord]);
    // Second: items
    mockDb.orderBy.mockResolvedValue(mockItems);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/services/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.mechanicName).toBe("Carlos");
    expect(body.customerName).toBe("Juan Pérez");
    expect(body.vehiclePatente).toBe("ABC-123");
    expect(body.items).toHaveLength(1);
    expect(body.items[0].description).toBe("Cambio de aceite");
  });
});

describe("PUT /api/services/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await PUT(
      createRequest("http://localhost:3000/api/services/1", "PUT", {
        mechanicName: "Pedro",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 404 when service not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);

    const res = await PUT(
      createRequest("http://localhost:3000/api/services/999", "PUT", {
        mechanicName: "Pedro",
      }),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Service no encontrado");
  });

  it("returns 409 when service is finalized", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([
      { ...mockRecord, status: "finalized" },
    ]);

    const res = await PUT(
      createRequest("http://localhost:3000/api/services/1", "PUT", {
        mechanicName: "Pedro",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain("modificar");
  });

  it("returns 400 when no fields provided", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([mockRecord]);

    const res = await PUT(
      createRequest("http://localhost:3000/api/services/1", "PUT", {}),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("campos");
  });

  it("updates service on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    // Get existing record
    mockDb.limit.mockResolvedValueOnce([mockRecord]);

    const updatedRecord = { ...mockRecord, mechanicName: "Pedro" };
    mockDb.transaction.mockImplementation(
      async (cb: (tx: typeof mockDb) => Promise<unknown>) => {
        const tx = {
          ...mockDb,
          returning: vi.fn().mockResolvedValue([updatedRecord]),
        };
        return cb(tx);
      },
    );

    const res = await PUT(
      createRequest("http://localhost:3000/api/services/1", "PUT", {
        mechanicName: "Pedro",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.mechanicName).toBe("Pedro");
  });
});

describe("DELETE /api/services/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/services/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 404 when service not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/services/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Service no encontrado");
  });

  it("returns 409 when service is finalized", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([
      { ...mockRecord, status: "finalized" },
    ]);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/services/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain("eliminar");
  });

  it("deletes service when in draft status", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([mockRecord]);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/services/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toBe("Servicio eliminado correctamente");
  });
});
