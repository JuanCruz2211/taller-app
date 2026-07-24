import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomerForm from "../customer-form";

// ── Mocks (hoisted to avoid vi.mock hoisting issues) ─────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockBack = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  })),
}));

vi.mock("@/lib/toast", () => ({
  showToast: mockShowToast,
}));

// ── Helpers ─────────────────────────────────────────────────────────

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nombre completo/i), "Juan Pérez");
  await user.type(screen.getByLabelText(/teléfono/i), "11 4455-6677");
}

const existingCustomer = {
  id: 1,
  workshopId: 1,
  name: "Carlos López",
  phone: "11 9876-5432",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
};

// ── Tests ───────────────────────────────────────────────────────────

describe("CustomerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("create mode", () => {
    it("renders empty form with Crear cliente button", () => {
      render(<CustomerForm />);

      expect(
        (screen.getByLabelText(/nombre completo/i) as HTMLInputElement).value,
      ).toBe("");
      expect(
        (screen.getByLabelText(/teléfono/i) as HTMLInputElement).value,
      ).toBe("");
      expect(
        screen.getByRole("button", { name: /crear cliente/i }),
      ).toBeDefined();
    });

    it("shows validation errors when submitted empty", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      expect(
        screen.getByText("El nombre del cliente es obligatorio"),
      ).toBeDefined();
      expect(
        screen.getByText("El teléfono es obligatorio"),
      ).toBeDefined();
    });

    it("shows 10-digit validation when phone has too few digits", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      await user.type(screen.getByLabelText(/nombre completo/i), "Test");
      await user.type(screen.getByLabelText(/teléfono/i), "12345");
      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      expect(
        screen.getByText("Ingresá un teléfono válido de al menos 10 dígitos"),
      ).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("calls POST /api/customers on submit", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<CustomerForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      expect(mockFetch).toHaveBeenCalledWith("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Juan Pérez", phone: "11 4455-6677" }),
      });
    });

    it("shows toast and redirects on success", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<CustomerForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      await vi.waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Cliente creado",
          "success",
        );
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard/clientes");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("shows server error on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "El teléfono ya existe" }),
      });
      const user = userEvent.setup();
      render(<CustomerForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      await vi.waitFor(() => {
        expect(screen.getByText("El teléfono ya existe")).toBeDefined();
      });
    });

    it("shows error message on exception", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();
      render(<CustomerForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      expect(screen.getByText("Network error")).toBeDefined();
    });
  });

  describe("edit mode", () => {
    it("renders form pre-filled with customer data", () => {
      render(<CustomerForm customer={existingCustomer} />);

      expect(
        (screen.getByLabelText(/nombre completo/i) as HTMLInputElement).value,
      ).toBe("Carlos López");
      expect(
        (screen.getByLabelText(/teléfono/i) as HTMLInputElement).value,
      ).toBe("11 9876-5432");
      expect(
        screen.getByRole("button", { name: /guardar cambios/i }),
      ).toBeDefined();
    });

    it("calls PUT /api/customers/:id on submit", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<CustomerForm customer={existingCustomer} />);

      await user.clear(screen.getByLabelText(/nombre completo/i));
      await user.type(
        screen.getByLabelText(/nombre completo/i),
        "Carlos López Editado",
      );
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/customers/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Carlos López Editado",
          phone: "11 9876-5432",
        }),
      });
    });

    it("shows toast with updated message on success", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<CustomerForm customer={existingCustomer} />);

      await user.clear(screen.getByLabelText(/nombre completo/i));
      await user.type(
        screen.getByLabelText(/nombre completo/i),
        "Carlos Editado",
      );
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      await vi.waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Cliente actualizado",
          "success",
        );
      });
    });
  });

  describe("cancel button", () => {
    it("calls router.back when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      await user.click(screen.getByRole("button", { name: /cancelar/i }));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("shows Creando… while submitting", async () => {
      let resolvePromise!: (value: unknown) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );
      const user = userEvent.setup();
      render(<CustomerForm />);

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /crear cliente/i }));

      expect(screen.getByText("Creando…")).toBeDefined();

      resolvePromise({ ok: true });
    });

    it("shows Guardando… while submitting in edit mode", async () => {
      let resolvePromise!: (value: unknown) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );
      const user = userEvent.setup();
      render(
        <CustomerForm customer={existingCustomer} />,
      );

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(screen.getByText("Guardando…")).toBeDefined();

      resolvePromise({ ok: true });
    });
  });
});
