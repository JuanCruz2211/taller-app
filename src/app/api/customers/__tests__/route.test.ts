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

describe("GET /api/customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost:3000/api/customers"));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 500 when db throws", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDb.$count.mockRejectedValue(new Error("DB error"));

    const res = await GET(new NextRequest("http://localhost:3000/api/customers"));
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
        name: "Juan Pérez",
        phone: "+5491144556677",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    ]);

    const res = await GET(new NextRequest("http://localhost:3000/api/customers"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
  });
});

describe("POST /api/customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/customers", {
        name: "Test",
        phone: "1144556677",
      }),
    );
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("returns 400 when name is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/customers", {
        phone: "1144556677",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("nombre");
  });

  it("returns 400 when phone is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/customers", {
        name: "Juan Pérez",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("teléfono");
  });

  it("returns 400 when phone is invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/customers", {
        name: "Juan Pérez",
        phone: "123",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("teléfono");
  });

  it("creates a customer on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const mockCustomer = {
      id: 1,
      workshopId: 1,
      name: "Juan Pérez",
      phone: "+5491144556677",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([mockCustomer]);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/customers", {
        name: "Juan Pérez",
        phone: "1144556677",
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.name).toBe("Juan Pérez");
    expect(body.phone).toBe("+5491144556677");
  });
});
