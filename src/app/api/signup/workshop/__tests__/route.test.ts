import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// ── Mocks ───────────────────────────────────────────────────────────

const mockSession = vi.hoisted(() => ({
  session: {
    id: "sess_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user_1",
    expiresAt: new Date(Date.now() + 86400_000),
    token: "tok_xxx",
  },
  user: {
    id: "user_1",
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
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
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

function createPostRequest(url: string, body: unknown): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("POST /api/signup/workshop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/signup/workshop", {
        name: "Mi Taller",
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
      createPostRequest("http://localhost:3000/api/signup/workshop", {
        phone: "1144556677",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("name");
  });

  it("returns 400 when phone is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/signup/workshop", {
        name: "Mi Taller",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("phone");
  });

  it("creates workshop and links user on valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    // Workshop insert → returns new id
    mockDb.returning.mockResolvedValue([{ id: 1 }]);

    const res = await POST(
      createPostRequest("http://localhost:3000/api/signup/workshop", {
        name: "Mi Taller",
        phone: "1144556677",
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.workshopId).toBe(1);

    // Verify the chain: insert workshop → update user with workshopId
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });
});
