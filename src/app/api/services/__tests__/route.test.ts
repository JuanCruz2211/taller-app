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

describe("GET /api/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost:3000/api/services"));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 500 when db throws", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // Mock breaks on the first .where() call (inside the count query)
    mockDb.where.mockRejectedValueOnce(new Error("DB error"));

    const res = await GET(new NextRequest("http://localhost:3000/api/services"));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("Error interno del servidor");
  });

  it("returns paginated results on success", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // First .where() call is for the count query (with joins)
    mockDb.where.mockResolvedValueOnce([{ total: 1 }]);
    mockDb.orderBy.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        vehicleId: 1,
        customerId: 1,
        mechanicName: "Carlos",
        kmAtService: 50000,
        date: new Date("2025-01-01"),
        status: "draft",
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
      },
    ]);

    const res = await GET(new NextRequest("http://localhost:3000/api/services"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.items[0].mechanicName).toBe("Carlos");
    expect(body.items[0].customerName).toBe("Juan Pérez");
    expect(body.items[0].vehiclePatente).toBe("ABC-123");
  });
});

describe("POST /api/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        kmAtService: 50000,
        customerId: 1,
        vehicleId: 1,
        items: [{ description: "Cambio de aceite" }],
      }),
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when mechanicName is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        kmAtService: 50000,
        customerId: 1,
        vehicleId: 1,
        items: [{ description: "Cambio de aceite" }],
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("mecánico");
  });

  it("returns 400 when kmAtService is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        customerId: 1,
        vehicleId: 1,
        items: [{ description: "Cambio de aceite" }],
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("km");
  });

  it("returns 400 when customerId is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        kmAtService: 50000,
        vehicleId: 1,
        items: [{ description: "Cambio de aceite" }],
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("cliente");
  });

  it("returns 400 when vehicleId is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        kmAtService: 50000,
        customerId: 1,
        items: [{ description: "Cambio de aceite" }],
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("vehículo");
  });

  it("returns 400 when items are missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        kmAtService: 50000,
        customerId: 1,
        vehicleId: 1,
        items: [],
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("item");
  });

  it("returns 400 when customer does not exist", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        kmAtService: 50000,
        customerId: 999,
        vehicleId: 1,
        items: [{ description: "Cambio de aceite" }],
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("cliente");
  });

  it("creates a service on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const mockRecord = {
      id: 1,
      workshopId: 1,
      customerId: 1,
      vehicleId: 1,
      mechanicName: "Carlos",
      kmAtService: 50000,
      date: new Date(),
      status: "draft",
      totalCost: "150.00",
      notes: "Test notes",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Customer lookup → returns customer
    mockDb.limit
      .mockResolvedValueOnce([{ id: 1, workshopId: 1, name: "Juan" }])
      // Vehicle lookup → returns vehicle
      .mockResolvedValueOnce([{ id: 1, workshopId: 1, patente: "ABC-123" }]);

    // Insert service record — mock returning for sequential insert
    mockDb.returning.mockResolvedValue([mockRecord]);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/services", {
        mechanicName: "Carlos",
        kmAtService: 50000,
        customerId: 1,
        vehicleId: 1,
        notes: "Test notes",
        items: [
          {
            description: "Cambio de aceite",
            partCost: "100.00",
            laborCost: "50.00",
          },
        ],
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.mechanicName).toBe("Carlos");
    expect(body.kmAtService).toBe(50000);
    expect(body.status).toBe("draft");
  });
});
