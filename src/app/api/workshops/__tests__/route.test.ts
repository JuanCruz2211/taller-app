import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "../route";

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

const mockWorkshop = vi.hoisted(() => ({
  id: 1,
  name: "Taller Test",
  phone: "+5491144556677",
  cuit: "20123456789",
  address: "Av. Siempre Viva 123",
  logoUrl: null,
  brandColor: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-06-01"),
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockWorkshop]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
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

// Import mocked modules
import { auth } from "@/lib/auth";

// ── Helpers ─────────────────────────────────────────────────────────

function mockGetSession() {
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
}

function createPutRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/workshops", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/workshops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("No autorizado");
  });

  it("returns 404 when workshop not found", async () => {
    vi.mocked(mockDb.limit).mockResolvedValueOnce([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Taller no encontrado");
  });

  it("returns workshop data", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Taller Test");
    expect(body.phone).toBe("+5491144556677");
    expect(body.cuit).toBe("20123456789");
    expect(body.address).toBe("Av. Siempre Viva 123");
  });
});

describe("PUT /api/workshops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession();
    // Default: select after update returns the same workshop
    vi.mocked(mockDb.limit).mockResolvedValue([mockWorkshop]);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await PUT(
      createPutRequest({ name: "Test", phone: "1144556677" }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when name is missing", async () => {
    const response = await PUT(createPutRequest({ phone: "1144556677" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("El nombre del taller es obligatorio");
  });

  it("returns 400 when name is empty", async () => {
    const response = await PUT(
      createPutRequest({ name: "", phone: "1144556677" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("El nombre del taller es obligatorio");
  });

  it("returns 400 when phone is missing", async () => {
    const response = await PUT(createPutRequest({ name: "Taller" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("El teléfono es obligatorio");
  });

  it("returns 400 when phone is invalid", async () => {
    const response = await PUT(
      createPutRequest({ name: "Taller", phone: "123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Teléfono inválido");
  });

  it("updates and returns the workshop", async () => {
    const updated = { ...mockWorkshop, name: "Taller Actualizado" };
    vi.mocked(mockDb.limit).mockResolvedValueOnce([updated]);

    const response = await PUT(
      createPutRequest({
        name: "Taller Actualizado",
        phone: "1144556677",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Taller Actualizado");

    // Verify db.update was called
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled();
  });

  it("accepts optional fields (cuit, address)", async () => {
    const updated = {
      ...mockWorkshop,
      name: "Taller con CUIT",
      cuit: "27123456789",
      address: "Calle Falsa 456",
    };
    vi.mocked(mockDb.limit).mockResolvedValueOnce([updated]);

    const response = await PUT(
      createPutRequest({
        name: "Taller con CUIT",
        phone: "1144556677",
        cuit: "27-12345678-9",
        address: "Calle Falsa 456",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Taller con CUIT");
    expect(body.cuit).toBe("27123456789");
    expect(body.address).toBe("Calle Falsa 456");
  });

  it("normalizes phone with +549 prefix", async () => {
    const updated = {
      ...mockWorkshop,
      name: "Taller Phone",
      phone: "+5491144556677",
    };
    vi.mocked(mockDb.limit).mockResolvedValueOnce([updated]);

    const response = await PUT(
      createPutRequest({
        name: "Taller Phone",
        phone: "11 4455-6677",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Taller Phone");
  });
});
