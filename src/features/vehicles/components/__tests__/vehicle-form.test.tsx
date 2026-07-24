import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VehicleForm from "../vehicle-form";

// ── Mocks (hoisted to avoid vi.mock hoisting issues) ─────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockBack = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

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

// ── Data ────────────────────────────────────────────────────────────

const mockCustomers = [
  { id: 1, name: "Juan Pérez", phone: "11 1234-5678" },
  { id: 2, name: "María García", phone: "11 9876-5432" },
];

const existingVehicle = {
  id: 5,
  workshopId: 1,
  patente: "ABC-123",
  brand: "Toyota",
  model: "Corolla",
  year: 2020,
  customerId: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
};

// ── Helpers ─────────────────────────────────────────────────────────

function makeFetchMock(vehicleResponse?: unknown) {
  return vi.fn((url: string) => {
    const urlStr = url.toString();
    if (urlStr.startsWith("/api/customers")) {
      const search = urlStr.includes("Juan") ? [mockCustomers[0]] : mockCustomers;
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: search }),
      });
    }
    return Promise.resolve(
      vehicleResponse ?? { ok: true, json: async () => ({}) },
    );
  });
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/patente/i), "ABC-123");
  await user.type(screen.getByLabelText(/marca/i), "Toyota");
  await user.type(screen.getByLabelText(/modelo/i), "Corolla");
  await user.type(screen.getByLabelText(/año/i), "2020");
}

async function selectFirstCustomer(user: ReturnType<typeof userEvent.setup>) {
  const customerInput = screen.getByPlaceholderText("Buscá un cliente…");
  await user.click(customerInput);
  await user.type(customerInput, "Juan");
  const option = await screen.findByText("Juan Pérez");
  await user.click(option);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("VehicleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode", () => {
    it("renders empty form with Crear vehículo button", () => {
      render(<VehicleForm />);

      expect(
        (screen.getByLabelText(/patente/i) as HTMLInputElement).value,
      ).toBe("");
      expect(
        (screen.getByLabelText(/marca/i) as HTMLInputElement).value,
      ).toBe("");
      expect(
        screen.getByRole("button", { name: /crear vehículo/i }),
      ).toBeDefined();
    });

    it("shows validation errors when submitted empty", async () => {
      const fetchMock = makeFetchMock();
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(screen.getByText("La patente es obligatoria")).toBeDefined();
      expect(screen.getByText("La marca es obligatoria")).toBeDefined();
      expect(screen.getByText("El modelo es obligatorio")).toBeDefined();
      expect(screen.getByText("Seleccioná un cliente")).toBeDefined();

      vi.unstubAllGlobals();
    });

    it("shows patente format error for invalid format", async () => {
      const fetchMock = makeFetchMock();
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await user.type(screen.getByLabelText(/patente/i), "XX");
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(
        screen.getByText("Formato inválido. Usá ABC-123 o AB-123-CD"),
      ).toBeDefined();

      vi.unstubAllGlobals();
    });

    it("accepts old patente format (ABC-123)", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await user.type(screen.getByLabelText(/patente/i), "ABC-123");
      await user.type(screen.getByLabelText(/marca/i), "Toyota");
      await user.type(screen.getByLabelText(/modelo/i), "Corolla");
      await user.type(screen.getByLabelText(/año/i), "2020");
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(fetchMock).toHaveBeenCalledWith("/api/vehicles", expect.any(Object));

      vi.unstubAllGlobals();
    });

    it("accepts new patente format (AB-123-CD)", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await user.type(screen.getByLabelText(/patente/i), "AB-123-CD");
      await user.type(screen.getByLabelText(/marca/i), "Toyota");
      await user.type(screen.getByLabelText(/modelo/i), "Corolla");
      await user.type(screen.getByLabelText(/año/i), "2020");
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(fetchMock).toHaveBeenCalledWith("/api/vehicles", expect.any(Object));

      vi.unstubAllGlobals();
    });

    it("shows year error when year is out of range", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await user.type(screen.getByLabelText(/patente/i), "ABC-123");
      await user.type(screen.getByLabelText(/marca/i), "Toyota");
      await user.type(screen.getByLabelText(/modelo/i), "Corolla");
      await user.type(screen.getByLabelText(/año/i), "1800");
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(
        screen.getByText("Ingresá un año válido (ej: 2020)"),
      ).toBeDefined();

      vi.unstubAllGlobals();
    });

    it("calls POST /api/vehicles on valid submit", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await fillForm(user);
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(fetchMock).toHaveBeenCalledWith("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patente: "ABC-123",
          brand: "Toyota",
          model: "Corolla",
          customerId: 1,
          year: 2020,
        }),
      });

      vi.unstubAllGlobals();
    });

    it("shows toast and redirects on success", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await fillForm(user);
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      await vi.waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Vehículo creado",
          "success",
        );
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard/vehiculos");
      expect(mockRefresh).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it("shows server error on failure", async () => {
      const fetchMock = makeFetchMock({
        ok: false,
        json: async () => ({ error: "La patente ya existe" }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await fillForm(user);
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      await vi.waitFor(() => {
        expect(screen.getByText("La patente ya existe")).toBeDefined();
      });

      vi.unstubAllGlobals();
    });

    it("shows error on exception", async () => {
      const fetchMock = vi.fn((url: string) => {
        const urlStr = url.toString();
        if (urlStr.startsWith("/api/customers")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: mockCustomers }),
          });
        }
        return Promise.reject(new Error("Network error"));
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm />);

      await fillForm(user);
      await selectFirstCustomer(user);
      await user.click(screen.getByRole("button", { name: /crear vehículo/i }));

      expect(screen.getByText("Network error")).toBeDefined();

      vi.unstubAllGlobals();
    });
  });

  describe("edit mode", () => {
    it("renders form pre-filled with vehicle data", () => {
      render(<VehicleForm vehicle={existingVehicle} />);

      expect(
        (screen.getByLabelText(/patente/i) as HTMLInputElement).value,
      ).toBe("ABC-123");
      expect(
        (screen.getByLabelText(/marca/i) as HTMLInputElement).value,
      ).toBe("Toyota");
      expect(
        (screen.getByLabelText(/modelo/i) as HTMLInputElement).value,
      ).toBe("Corolla");
      expect(
        (screen.getByLabelText(/año/i) as HTMLInputElement).value,
      ).toBe("2020");
      expect(
        screen.getByRole("button", { name: /guardar cambios/i }),
      ).toBeDefined();
    });

    it("calls PUT /api/vehicles/:id on submit", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm vehicle={existingVehicle} />);

      await user.clear(screen.getByLabelText(/marca/i));
      await user.type(screen.getByLabelText(/marca/i), "Honda");
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      expect(fetchMock).toHaveBeenCalledWith("/api/vehicles/5", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patente: "ABC-123",
          brand: "Honda",
          model: "Corolla",
          customerId: 1,
          year: 2020,
        }),
      });

      vi.unstubAllGlobals();
    });

    it("shows toast on update success", async () => {
      const fetchMock = makeFetchMock({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      render(<VehicleForm vehicle={existingVehicle} />);

      await user.clear(screen.getByLabelText(/marca/i));
      await user.type(screen.getByLabelText(/marca/i), "Honda");
      await user.click(
        screen.getByRole("button", { name: /guardar cambios/i }),
      );

      await vi.waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Vehículo actualizado",
          "success",
        );
      });

      vi.unstubAllGlobals();
    });
  });

  describe("customer dropdown", () => {
    it("shows loading state while fetching customers", async () => {
      let resolveCustomers!: (value: unknown) => void;
      const fetchMock = vi.fn((url: string) => {
        if (url.toString().includes("/api/customers")) {
          return new Promise((resolve) => {
            resolveCustomers = resolve;
          });
        }
        return Promise.resolve({ ok: true });
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      render(<VehicleForm />);

      const customerInput = screen.getByPlaceholderText("Buscá un cliente…");
      await user.click(customerInput);

      expect(screen.getByText("Buscando clientes…")).toBeDefined();

      resolveCustomers({
        ok: true,
        json: async () => ({ items: mockCustomers }),
      });

      vi.unstubAllGlobals();
    });

    it("shows no customers found when list is empty", async () => {
      const fetchMock = vi.fn((url: string) => {
        if (url.toString().includes("/api/customers")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: [] }),
          });
        }
        return Promise.resolve({ ok: true });
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      render(<VehicleForm />);

      const customerInput = screen.getByPlaceholderText("Buscá un cliente…");
      await user.click(customerInput);

      const noResults = await screen.findByText("No se encontraron clientes");
      expect(noResults).toBeDefined();

      vi.unstubAllGlobals();
    });

    it("displays customer list and allows selection", async () => {
      const fetchMock = makeFetchMock();
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      render(<VehicleForm />);

      await selectFirstCustomer(user);

      // After selection the dropdown should close
      expect(fetchMock).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe("cancel button", () => {
    it("calls router.back when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<VehicleForm />);

      await user.click(screen.getByRole("button", { name: /cancelar/i }));

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
