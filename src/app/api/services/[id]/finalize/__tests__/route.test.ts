import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

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
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
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

function createPostRequest(url: string): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, {
    method: "POST",
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("POST /api/services/[id]/finalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/services/1/finalize"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is not a number", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/services/abc/finalize"),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when service not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/services/999/finalize"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Service no encontrado");
  });

  it("returns 409 when service is already finalized", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        vehicleId: 1,
        customerId: 1,
        mechanicName: "Carlos",
        kmAtService: 50000,
        date: new Date(),
        status: "finalized",
        totalCost: "150.00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/services/1/finalize"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain("finalizado");
  });

  it("finalizes a draft service and recalculates total", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Service lookup → returns draft
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 1,
        workshopId: 1,
        vehicleId: 1,
        customerId: 1,
        mechanicName: "Carlos",
        kmAtService: 50000,
        date: new Date(),
        status: "draft",
        totalCost: "0.00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Items found
    mockDb.orderBy.mockResolvedValueOnce([
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
      {
        id: 2,
        serviceRecordId: 1,
        description: "Filtro de aire",
        category: null,
        partCost: "30.00",
        laborCost: "20.00",
        nextServiceKm: null,
        nextServiceMonths: null,
        sortOrder: 1,
      },
    ]);

    // Update returning
    const updatedRecord = {
      id: 1,
      workshopId: 1,
      vehicleId: 1,
      customerId: 1,
      mechanicName: "Carlos",
      kmAtService: 50000,
      date: new Date(),
      status: "finalized",
      totalCost: "200.00",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([updatedRecord]);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/services/1/finalize"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("finalized");
    expect(body.totalCost).toBe("200.00");
  });
});
