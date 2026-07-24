import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../route";

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

function createPutRequest(url: string, body: unknown): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/customers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/customers/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is not a number", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/customers/abc"),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when customer not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/customers/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Cliente no encontrado");
  });

  it("returns customer on success", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    ]);

    const res = await GET(
      new NextRequest("http://localhost:3000/api/customers/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.name).toBe("Juan Pérez");
    expect(body.phone).toBe("+5491144556677");
  });
});

describe("PUT /api/customers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/1", {
        name: "Nuevo Nombre",
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
      createPutRequest("http://localhost:3000/api/customers/abc", {}),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when customer not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/999", {
        name: "Nuevo Nombre",
      }),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Cliente no encontrado");
  });

  it("returns 400 when no fields provided", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/1", {}),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("campos");
  });

  it("returns 400 when name is empty", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/1", {
        name: "",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("nombre");
  });

  it("returns 400 when phone is invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/1", {
        phone: "123",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("teléfono");
  });

  it("updates customer name on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const updatedCustomer = {
      id: 1,
      workshopId: 1,
      name: "Pedro García",
      phone: "+5491144556677",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([updatedCustomer]);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/1", {
        name: "Pedro García",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.name).toBe("Pedro García");
  });

  it("updates customer phone on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const updatedCustomer = {
      id: 1,
      workshopId: 1,
      name: "Juan Pérez",
      phone: "+5491155667788",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([updatedCustomer]);

    const res = await PUT(
      createPutRequest("http://localhost:3000/api/customers/1", {
        phone: "1155667788",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.phone).toBe("+5491155667788");
  });
});

describe("DELETE /api/customers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/customers/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when id is invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/customers/abc"),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("ID inválido");
  });

  it("returns 404 when customer not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([]);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/customers/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Cliente no encontrado");
  });

  it("returns 409 when customer has services", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockDb.$count.mockResolvedValue(3);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/customers/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain("servicios");
  });

  it("deletes customer when no services exist", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.limit.mockResolvedValue([
      {
        id: 1,
        workshopId: 1,
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockDb.$count.mockResolvedValue(0);

    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/customers/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toBe("Cliente eliminado correctamente");
  });
});
