import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../register-form";

// ── Mocks (hoisted to avoid vi.mock hoisting issues) ─────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockNormalizePhone = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: { email: mockSignUp },
    getSession: mockGetSession,
  },
}));

vi.mock("@/lib/phone", () => ({
  normalizePhone: mockNormalizePhone,
}));

// ── Helpers ─────────────────────────────────────────────────────────

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nombre del taller/i), "Taller Test");
  await user.type(
    screen.getByRole("textbox", { name: /email/i }),
    "test@taller.com",
  );
  await user.type(
    screen.getByLabelText(/teléfono/i),
    "11 1234-5678",
  );
  await user.type(
    screen.getByLabelText(/contraseña/i),
    "password123",
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("shows all errors when form is submitted empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(
        screen.getByText("El nombre del taller es obligatorio"),
      ).toBeDefined();
      expect(screen.getByText("El email es obligatorio")).toBeDefined();
      expect(screen.getByText("El teléfono es obligatorio")).toBeDefined();
      expect(
        screen.getByText("La contraseña es obligatoria"),
      ).toBeDefined();
    });

    it("shows email error for invalid format", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(
        screen.getByRole("textbox", { name: /email/i }),
        "invalido",
      );
      await user.type(
        screen.getByLabelText(/contraseña/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(screen.getByText("Ingresá un email válido")).toBeDefined();
    });

    it("shows password error when too short", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(
        screen.getByRole("textbox", { name: /email/i }),
        "test@test.com",
      );
      await user.type(
        screen.getByLabelText(/contraseña/i),
        "1234567",
      );
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(
        screen.getByText("La contraseña debe tener al menos 8 caracteres"),
      ).toBeDefined();
    });
  });

  describe("submission", () => {
    beforeEach(() => {
      mockNormalizePhone.mockReturnValue("+5491112345678");
      mockFetch.mockReset();
      // Replace global fetch with mock
      vi.stubGlobal("fetch", mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("calls signUp.email with form data", async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockFetch.mockResolvedValue({ ok: true });
      mockGetSession.mockResolvedValue({});

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@taller.com",
        password: "password123",
        name: "Taller Test",
      });
    });

    it("creates workshop via API after signup", async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockFetch.mockResolvedValue({ ok: true });
      mockGetSession.mockResolvedValue({});

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      // Normalize the phone
      expect(mockNormalizePhone).toHaveBeenCalledWith("11 1234-5678");

      expect(mockFetch).toHaveBeenCalledWith("/api/signup/workshop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Taller Test",
          phone: "+5491112345678",
        }),
      });
    });

    it("refreshes session and redirects on success", async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockFetch.mockResolvedValue({ ok: true });
      mockGetSession.mockResolvedValue({});

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      // Wait for all async work
      await vi.waitFor(() => {
        expect(mockGetSession).toHaveBeenCalled();
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("shows already registered error when user exists", async () => {
      mockSignUp.mockResolvedValue({
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "User already exists",
        },
      });

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(
        screen.getByText("Este email ya está registrado"),
      ).toBeDefined();
    });

    it("shows server error from signUp when message is provided", async () => {
      mockSignUp.mockResolvedValue({
        error: { message: "Signup is disabled", code: "" },
      });

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(screen.getByText("Signup is disabled")).toBeDefined();
    });

    it("shows phone error when phone normalization fails", async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockNormalizePhone.mockImplementation(() => {
        throw new Error("Invalid phone");
      });

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(
        screen.getByText("Ingresá un teléfono argentino válido (ej: 11 1234-5678)"),
      ).toBeDefined();
    });

    it("shows error when workshop creation fails", async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockNormalizePhone.mockReturnValue("+5491112345678");
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Workshop name already in use" }),
      });

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      await vi.waitFor(() => {
        expect(
          screen.getByText("Workshop name already in use"),
        ).toBeDefined();
      });
    });

    it("shows generic server error on exception", async () => {
      mockSignUp.mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(
        screen.getByText("Error del servidor. Intentalo de nuevo."),
      ).toBeDefined();
    });
  });
});
