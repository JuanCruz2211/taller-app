import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../login-form";

// ── Mocks (hoisted to avoid vi.mock hoisting issues) ─────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockSignIn = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: mockSignIn,
    },
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────

async function typeInto(
  element: HTMLElement,
  value: string,
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.clear(element);
  await user.type(element, value);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("shows email error when email is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByText("El email es obligatorio"),
      ).toBeDefined();
    });

    it("shows email error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(screen.getByLabelText(/email/i), "invalido", user);
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByText("Ingresá un email válido"),
      ).toBeDefined();
    });

    it("shows password error when password is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@test.com",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByText("La contraseña es obligatoria"),
      ).toBeDefined();
    });

    it("shows multiple errors at once", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByText("El email es obligatorio"),
      ).toBeDefined();
      expect(
        screen.getByText("La contraseña es obligatoria"),
      ).toBeDefined();
    });
  });

  describe("submission", () => {
    it("calls authClient.signIn.email with credentials on submit", async () => {
      mockSignIn.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@taller.com",
        user,
      );
      await typeInto(
        screen.getByLabelText(/contraseña/i),
        "password123",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@taller.com",
        password: "password123",
      });
    });

    it("redirects to /dashboard on success", async () => {
      mockSignIn.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@taller.com",
        user,
      );
      await typeInto(
        screen.getByLabelText(/contraseña/i),
        "password123",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("shows invalid credentials error", async () => {
      mockSignIn.mockResolvedValue({
        error: { message: "Invalid email or password" },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@taller.com",
        user,
      );
      await typeInto(
        screen.getByLabelText(/contraseña/i),
        "wrong",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByText("Email o contraseña incorrectos"),
      ).toBeDefined();
    });

    it("shows generic error message from server", async () => {
      mockSignIn.mockResolvedValue({
        error: { message: "Server timeout" },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@taller.com",
        user,
      );
      await typeInto(
        screen.getByLabelText(/contraseña/i),
        "password123",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(screen.getByText("Server timeout")).toBeDefined();
    });

    it("shows server error when exception is thrown", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@taller.com",
        user,
      );
      await typeInto(
        screen.getByLabelText(/contraseña/i),
        "password123",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByText("Error del servidor. Intentalo de nuevo."),
      ).toBeDefined();
    });
  });

  describe("loading state", () => {
    it("shows loading text while submitting", async () => {
      let resolvePromise!: (value: unknown) => void;
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );
      const user = userEvent.setup();
      render(<LoginForm />);

      await typeInto(
        screen.getByLabelText(/email/i),
        "test@taller.com",
        user,
      );
      await typeInto(
        screen.getByLabelText(/contraseña/i),
        "password123",
        user,
      );
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

      expect(
        screen.getByRole("button", { name: /iniciando sesión/i }),
      ).toBeDefined();

      resolvePromise({ error: null });
    });
  });
});
