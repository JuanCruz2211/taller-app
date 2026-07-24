import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

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

const mockRenderToBuffer = vi.hoisted(() =>
  vi.fn().mockResolvedValue(Buffer.from("%PDF-1.4 mock pdf content")),
);

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

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: mockRenderToBuffer,
  Document: "Document",
  Page: "Page",
  Text: "Text",
  View: "View",
  StyleSheet: { create: vi.fn((s) => s) },
  Font: { register: vi.fn() },
  Image: "Image",
}));

vi.mock("@/lib/pdf", () => ({
  ServiceReportDocument: "ServiceReportDocument",
}));

// Import the mocked auth
import { auth } from "@/lib/auth";

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/reports/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/reports/1"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/reports/abc"),
      { params: Promise.resolve({ id: "abc" }) },
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when workshop is not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValueOnce([]); // No workshop found

    const res = await GET(
      new NextRequest("http://localhost:3000/api/reports/1"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Taller no encontrado");
  });

  it("returns 404 when service is not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // Workshop found
    mockDb.limit.mockResolvedValueOnce([
      { id: 1, name: "Taller Test", logoUrl: null, brandColor: null, phone: "+549111", address: null, cuit: null },
    ]);
    // No service found
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/reports/999"),
      { params: Promise.resolve({ id: "999" }) },
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Service no encontrado");
  });

  it("returns 409 when service is not finalized", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // Workshop found
    mockDb.limit.mockResolvedValueOnce([
      { id: 1, name: "Taller Test", logoUrl: null, brandColor: null, phone: "+549111", address: null, cuit: null },
    ]);
    // Service found but in draft
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
        totalCost: "150.00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerName: "Juan Pérez",
        customerPhone: "+5491144556677",
        vehiclePatente: "ABC-123",
        vehicleBrand: "Toyota",
        vehicleModel: "Corolla",
        vehicleYear: 2020,
      },
    ]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/reports/1"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("finalizados");
  });

  it("returns application/pdf on successful generation", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // Workshop found
    mockDb.limit.mockResolvedValueOnce([
      { id: 1, name: "Taller Test", logoUrl: null, brandColor: null, phone: "+5491144556677", address: "Calle 123", cuit: "30-12345678-9" },
    ]);
    // Service found — finalized
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 1,
        workshopId: 1,
        vehicleId: 1,
        customerId: 1,
        mechanicName: "Carlos",
        kmAtService: 50000,
        date: new Date("2025-01-15"),
        status: "finalized",
        totalCost: "150.00",
        notes: "Todo en orden",
        createdAt: new Date(),
        updatedAt: new Date(),
        customerName: "Juan Pérez",
        customerPhone: "+5491144556677",
        vehiclePatente: "ABC-123",
        vehicleBrand: "Toyota",
        vehicleModel: "Corolla",
        vehicleYear: 2020,
      },
    ]);
    // Items found
    mockDb.orderBy.mockResolvedValueOnce([
      {
        id: 1,
        serviceRecordId: 1,
        description: "Cambio de aceite",
        category: "Mantenimiento",
        partCost: "100.00",
        laborCost: "50.00",
        nextServiceKm: 55000,
        nextServiceMonths: 6,
        sortOrder: 0,
      },
    ]);

    mockRenderToBuffer.mockResolvedValue(
      Buffer.from("%PDF-1.4 mock pdf content"),
    );

    const res = await GET(
      new NextRequest("http://localhost:3000/api/reports/1"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="reporte-1.pdf"',
    );
  });
});
