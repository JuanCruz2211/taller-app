import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkshopForm from "../workshop-form";

// ── Mocks (hoisted to avoid vi.mock hoisting issues) ─────────────────

const mockRefresh = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: mockRefresh })),
}));

vi.mock("@/lib/toast", () => ({
  showToast: mockShowToast,
}));

// ── Data ────────────────────────────────────────────────────────────

const workshop = {
  id: 1,
  name: "Taller Mecánico Pérez",
  phone: "+5491112345678",
  cuit: "20123456789",
  address: "Av. Siempre Viva 123",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
};

// ── Tests ───────────────────────────────────────────────────────────

describe("WorkshopForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("rendering", () => {
    it("renders form pre-filled with workshop data", () => {
      render(<WorkshopForm workshop={workshop} />);

      expect(
        (screen.getByLabelText(/nombre del taller/i) as HTMLInputElement)
          .value,
      ).toBe("Taller Mecánico Pérez");
      expect(
        (screen.getByLabelText(/teléfono/i) as HTMLInputElement).value,
      ).toBe("+5491112345678");
      expect(
        (screen.getByLabelText(/cuit/i) as HTMLInputElement).value,
      ).toBe("20123456789");
      expect(
        (screen.getByLabelText(/dirección/i) as HTMLInputElement).value,
      ).toBe("Av. Siempre Viva 123");
      expect(
        screen.getByRole("button", { name: /guardar cambios/i }),
      ).toBeDefined();
    });

    it("shows CUIT as optional hint", () => {
      render(<WorkshopForm workshop={workshop} />);

      expect(
        screen.getByText("Opcional. Usado para facturación."),
      ).toBeDefined();
    });

    it("shows address as optional hint", () => {
      render(<WorkshopForm workshop={workshop} />);

      expect(screen.getByText("Opcional.")).toBeDefined();
    });
  });

  describe("validation", () => {
    it("shows error when name is empty", async () => {
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.clear(screen.getByLabelText(/nombre del taller/i));
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(
        screen.getByText("El nombre del taller es obligatorio"),
      ).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows error when phone is empty", async () => {
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.clear(screen.getByLabelText(/teléfono/i));
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(
        screen.getByText("El teléfono es obligatorio"),
      ).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows phone error when phone has fewer than 10 digits", async () => {
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.clear(screen.getByLabelText(/teléfono/i));
      await user.type(screen.getByLabelText(/teléfono/i), "12345");
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(
        screen.getByText("Ingresá un teléfono válido de al menos 10 dígitos"),
      ).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows CUIT error when CUIT has wrong digit count", async () => {
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.clear(screen.getByLabelText(/cuit/i));
      await user.type(screen.getByLabelText(/cuit/i), "12345");
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(
        screen.getByText("El CUIT debe tener 11 dígitos (ej: 20-12345678-9)"),
      ).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("accepts empty CUIT (optional field)", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={{ ...workshop, cuit: null }} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(mockFetch).toHaveBeenCalled();
    });

    it("accepts empty address (optional field)", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={{ ...workshop, address: null }} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls PUT /api/workshops with form data", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.clear(screen.getByLabelText(/nombre del taller/i));
      await user.type(
        screen.getByLabelText(/nombre del taller/i),
        "Taller Editado",
      );
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/workshops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Taller Editado",
          phone: "+5491112345678",
          cuit: "20123456789",
          address: "Av. Siempre Viva 123",
        }),
      });
    });

    it("sends null for empty CUIT", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={{ ...workshop, cuit: null }} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.cuit).toBeNull();
    });

    it("sends null for empty address", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={{ ...workshop, address: null }} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.address).toBeNull();
    });

    it("shows toast on success", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      await vi.waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Taller actualizado",
          "success",
        );
      });
    });

    it("refreshes router on success", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      await vi.waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows server error on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "El teléfono ya está en uso" }),
      });
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      await vi.waitFor(() => {
        expect(
          screen.getByText("El teléfono ya está en uso"),
        ).toBeDefined();
      });
    });

    it("shows error on exception", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(screen.getByText("Network error")).toBeDefined();
    });
  });

  describe("loading state", () => {
    it("shows Guardando… while submitting", async () => {
      let resolvePromise!: (value: unknown) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );
      const user = userEvent.setup();
      render(<WorkshopForm workshop={workshop} />);

      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(screen.getByText("Guardando…")).toBeDefined();

      resolvePromise({ ok: true });
    });
  });
});
