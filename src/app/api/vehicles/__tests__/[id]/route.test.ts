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

function createRequest(url: string, method: string, body?: unknown): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/vehicles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/vehicles/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is not a number", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/vehicles/abc"),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when vehicle not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/vehicles/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Vehículo no encontrado");
  });

  it("returns vehicle with customer data on success", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.leftJoin.mockReturnThis();
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        customerId: 1,
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        year: 2020,
        currentKm: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        customerName: "Juan Pérez",
        customerPhone: "+5491144556677",
      },
    ]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/vehicles/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.patente).toBe("ABC-123");
    expect(body.customerName).toBe("Juan Pérez");
    expect(body.customerPhone).toBe("+5491144556677");
  });
});

describe("PUT /api/vehicles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await PUT(
      createRequest("http://localhost:3000/api/vehicles/1", "PUT", {
        brand: "Ford",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await PUT(
      createRequest("http://localhost:3000/api/vehicles/abc", "PUT", {}),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when vehicle not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await PUT(
      createRequest("http://localhost:3000/api/vehicles/999", "PUT", {
        brand: "Ford",
      }),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Vehículo no encontrado");
  });

  it("returns 400 when no fields provided", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        customerId: 1,
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        year: 2020,
        currentKm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await PUT(
      createRequest("http://localhost:3000/api/vehicles/1", "PUT", {}),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("campos");
  });

  it("updates vehicle brand on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // First limit call: get vehicle
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 1,
        workshopId: 1,
        customerId: 1,
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        year: 2020,
        currentKm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const updatedVehicle = {
      id: 1,
      workshopId: 1,
      customerId: 1,
      patente: "ABC-123",
      brand: "Ford",
      model: "Corolla",
      year: 2020,
      currentKm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([updatedVehicle]);

    const res = await PUT(
      createRequest("http://localhost:3000/api/vehicles/1", "PUT", {
        brand: "Ford",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.brand).toBe("Ford");
  });
});

describe("DELETE /api/vehicles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/vehicles/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 404 when vehicle not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/vehicles/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Vehículo no encontrado");
  });

  it("returns 409 when vehicle has services", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        customerId: 1,
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        year: 2020,
        currentKm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockDb.$count.mockResolvedValue(2);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/vehicles/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain("servicios");
  });

  it("deletes vehicle when no services exist", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        customerId: 1,
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        year: 2020,
        currentKm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockDb.$count.mockResolvedValue(0);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/vehicles/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toBe("Vehículo eliminado correctamente");
  });
});
