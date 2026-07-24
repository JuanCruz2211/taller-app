import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

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

vi.mock("@/lib/workshop", () => ({
  getWorkshopId: vi.fn().mockResolvedValue(1),
}));

// Import the mocked auth
import { auth } from "@/lib/auth";

// ── Helpers ─────────────────────────────────────────────────────────

function createPostRequest(
  url: string,
  body: unknown,
): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/vehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost:3000/api/vehicles"));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 500 when db throws", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.$count.mockRejectedValue(new Error("DB error"));

    const res = await GET(new NextRequest("http://localhost:3000/api/vehicles"));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("Error interno del servidor");
  });

  it("returns paginated results on success", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.$count.mockResolvedValue(1);
    mockDb.orderBy.mockResolvedValue([
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
      },
    ]);

    const res = await GET(new NextRequest("http://localhost:3000/api/vehicles"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.items[0].patente).toBe("ABC-123");
    expect(body.items[0].customerName).toBe("Juan Pérez");
  });

  it("passes search param to query", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.$count.mockResolvedValue(0);
    mockDb.orderBy.mockResolvedValue([]);

    const url = "http://localhost:3000/api/vehicles?search=Toyota";
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe("POST /api/vehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        customerId: 1,
      }),
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when patente is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        brand: "Toyota",
        model: "Corolla",
        customerId: 1,
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("patente");
  });

  it("returns 400 when patente format is invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "INVALIDA",
        brand: "Toyota",
        model: "Corolla",
        customerId: 1,
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("patente");
  });

  it("returns 400 when brand is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "ABC-123",
        model: "Corolla",
        customerId: 1,
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("marca");
  });

  it("returns 400 when model is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "ABC-123",
        brand: "Toyota",
        customerId: 1,
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("modelo");
  });

  it("returns 400 when customerId is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("cliente");
  });

  it("creates a vehicle on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock customer lookup
    mockDb.limit.mockResolvedValueOnce([
      { id: 1, workshopId: 1, name: "Juan Pérez" },
    ]);

    const mockVehicle = {
      id: 1,
      workshopId: 1,
      customerId: 1,
      patente: "ABC-123",
      brand: "Toyota",
      model: "Corolla",
      year: null,
      currentKm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([mockVehicle]);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "ABC-123",
        brand: "Toyota",
        model: "Corolla",
        customerId: 1,
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.patente).toBe("ABC-123");
    expect(body.brand).toBe("Toyota");
    expect(body.model).toBe("Corolla");
  });

  it("accepts new format patente (AB-123-CD)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    mockDb.limit.mockResolvedValueOnce([
      { id: 1, workshopId: 1, name: "Juan Pérez" },
    ]);

    const mockVehicle = {
      id: 2,
      workshopId: 1,
      customerId: 1,
      patente: "AB-123-CD",
      brand: "Ford",
      model: "Focus",
      year: 2022,
      currentKm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([mockVehicle]);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/vehicles", {
        patente: "AB-123-CD",
        brand: "Ford",
        model: "Focus",
        year: 2022,
        customerId: 1,
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.patente).toBe("AB-123-CD");
    expect(body.year).toBe(2022);
  });
});
