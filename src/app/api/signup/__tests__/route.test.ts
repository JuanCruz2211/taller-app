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

const mockSignups = vi.hoisted(() => [
  {
    id: 1,
    workshopName: "Taller Uno",
    email: "uno@test.com",
    phone: "+5491144556677",
    createdAt: new Date("2026-07-20"),
  },
  {
    id: 2,
    workshopName: "Taller Dos",
    email: "dos@test.com",
    phone: "+5491166778899",
    createdAt: new Date("2026-07-22"),
  },
]);

const mockDb = vi.hoisted(() => ({
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(mockSignups),
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
  getSessionUser: vi.fn().mockResolvedValue(mockSession.user),
}));

import { auth } from "@/lib/auth";

// ── Helpers ─────────────────────────────────────────────────────────

function mockGetSession() {
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("GET /api/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession();
    vi.mocked(mockDb.orderBy).mockResolvedValue(mockSignups);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("No autorizado");
  });

  it("returns signups ordered by newest first", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].workshopName).toBe("Taller Uno");
    expect(body[1].email).toBe("dos@test.com");
  });

  it("returns empty array when no signups", async () => {
    vi.mocked(mockDb.orderBy).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});

describe("POST /api/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when workshopName is missing", async () => {
    const response = await POST(
      createPostRequest({ email: "test@test.com", phone: "1144556677" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("El nombre del taller es obligatorio");
  });

  it("returns 400 when email is invalid", async () => {
    const response = await POST(
      createPostRequest({
        workshopName: "Taller",
        email: "invalido",
        phone: "1144556677",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Ingresá un email válido");
  });

  it("returns 400 when phone is invalid", async () => {
    const response = await POST(
      createPostRequest({
        workshopName: "Taller",
        email: "test@test.com",
        phone: "123",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Ingresá un teléfono válido");
  });

  it("creates signup and returns 201", async () => {
    vi.mocked(mockDb.values).mockReturnThis();

    const response = await POST(
      createPostRequest({
        workshopName: "Taller Nuevo",
        email: "nuevo@test.com",
        phone: "11 4455-6677",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe("Registrado en la lista de espera");

    // Verify the insert was called with normalized phone
    expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
    expect(mockDb.values).toHaveBeenCalledWith({
      workshopName: "Taller Nuevo",
      email: "nuevo@test.com",
      phone: "+5491144556677",
    });
  });
});
