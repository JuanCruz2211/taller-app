import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildReminderList } from "@/lib/reminders";
import type { KmReminderRow, DateReminderRow } from "@/lib/reminders";

// ── Helpers ──────────────────────────────────────────────────────────

function kmItem(overrides: Partial<KmReminderRow> = {}): KmReminderRow {
  return {
    id: 1,
    description: "Cambio de aceite",
    nextServiceKm: 50000,
    currentKm: 49000,
    serviceDate: new Date("2026-01-15"),
    serviceRecordId: 10,
    vehiclePatente: "ABC-123",
    vehicleBrand: "Toyota",
    vehicleModel: "Corolla",
    vehicleId: 100,
    customerName: "Juan Pérez",
    ...overrides,
  };
}

function dateItem(overrides: Partial<DateReminderRow> = {}): DateReminderRow {
  return {
    id: 2,
    description: "Pastillas de freno",
    serviceDate: new Date("2026-04-15"),
    nextServiceMonths: 2,
    serviceRecordId: 20,
    vehiclePatente: "DEF-456",
    vehicleBrand: "VW",
    vehicleModel: "Gol",
    vehicleId: 200,
    customerName: "María García",
    ...overrides,
  };
}

// ── Setup ────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
});

// ── Tests ────────────────────────────────────────────────────────────

describe("buildReminderList", () => {
  it("returns empty array when no items", () => {
    const result = buildReminderList([], []);
    expect(result).toEqual([]);
  });

  describe("km reminders", () => {
    it("sorts overdue km items before upcoming ones", () => {
      const result = buildReminderList(
        [
          kmItem({ id: 1, currentKm: 49000, nextServiceKm: 50000 }), // 1000 km remaining
          kmItem({ id: 2, currentKm: 50500, nextServiceKm: 50000 }), // -500 km (overdue)
        ],
        [],
      );

      expect(result[0].id).toBe(2); // overdue first
      expect(result[1].id).toBe(1);
    });

    it("sorts upcoming km items by closest first", () => {
      const result = buildReminderList(
        [
          kmItem({ id: 1, currentKm: 45000 }), // 5000 km remaining
          kmItem({ id: 2, currentKm: 49500 }), // 500 km remaining
          kmItem({ id: 3, currentKm: 49800 }), // 200 km remaining
        ],
        [],
      );

      expect(result[0].id).toBe(3); // 200 km
      expect(result[1].id).toBe(2); // 500 km
      expect(result[2].id).toBe(1); // 5000 km
    });

    it("labels overdue item correctly", () => {
      const result = buildReminderList(
        [kmItem({ currentKm: 51200, nextServiceKm: 50000 })],
        [],
      );

      expect(result[0].urgencyLabel).toBe("VENCIDO por 1200 km");
      expect(result[0].isOverdue).toBe(true);
    });

    it("labels upcoming item correctly", () => {
      const result = buildReminderList(
        [kmItem({ currentKm: 49200, nextServiceKm: 50000 })],
        [],
      );

      expect(result[0].urgencyLabel).toBe("Próximo cambio en 800 km");
      expect(result[0].isOverdue).toBe(false);
    });

    it("marks item as close when remaining < 500 km", () => {
      const result = buildReminderList(
        [
          kmItem({ id: 1, currentKm: 49800 }), // 200 km → close
          kmItem({ id: 2, currentKm: 49500 }), // 500 km → NOT close (isClose is < 500)
          kmItem({ id: 3, currentKm: 45000 }), // 5000 km → NOT close
        ],
        [],
      );

      expect(result[0].isClose).toBe(true); // 200 km
      expect(result[1].isClose).toBe(false); // 500 km
      expect(result[2].isClose).toBe(false); // 5000 km
    });

    it("filters out items with null currentKm", () => {
      const result = buildReminderList(
        [
          kmItem({ id: 1, currentKm: null }),
          kmItem({ id: 2, currentKm: 49500 }),
        ],
        [],
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("filters out items with null nextServiceKm", () => {
      const result = buildReminderList(
        [
          kmItem({ id: 1, nextServiceKm: null, currentKm: 50000 }),
          kmItem({ id: 2, nextServiceKm: 50000, currentKm: 49000 }),
        ],
        [],
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe("date reminders", () => {
    it("sorts overdue date items before upcoming ones", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({
            id: 1,
            serviceDate: new Date("2026-04-01"),
            nextServiceMonths: 1,
          }), // due 2026-05-01 → -31 days (overdue)
          dateItem({
            id: 2,
            serviceDate: new Date("2026-05-15"),
            nextServiceMonths: 1,
          }), // due 2026-06-15 → 14 days
        ],
      );

      expect(result[0].id).toBe(1); // overdue first
      expect(result[1].id).toBe(2);
    });

    it("sorts upcoming date items by closest first", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({
            id: 1,
            serviceDate: new Date("2026-04-01"),
            nextServiceMonths: 5,
          }), // due 2026-09-01 → 92 days
          dateItem({
            id: 2,
            serviceDate: new Date("2026-05-10"),
            nextServiceMonths: 1,
          }), // due 2026-06-10 → 9 days
          dateItem({
            id: 3,
            serviceDate: new Date("2026-04-01"),
            nextServiceMonths: 2,
          }), // due 2026-06-01 → 0 days
        ],
      );

      expect(result[0].id).toBe(3); // 0 days
      expect(result[1].id).toBe(2); // 9 days
      expect(result[2].id).toBe(1); // 92 days
    });

    it("labels overdue item correctly", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({
            serviceDate: new Date("2026-03-01"),
            nextServiceMonths: 2,
          }), // overdue relative to 2026-06-01
        ],
      );

      expect(result[0].urgencyLabel).toMatch(/^VENCIDO hace \d+ días$/);
      expect(result[0].isOverdue).toBe(true);
    });

    it("labels upcoming item correctly", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({
            serviceDate: new Date("2026-05-15"),
            nextServiceMonths: 1,
          }), // due 2026-06-15 → 14 days
        ],
      );

      expect(result[0].urgencyLabel).toBe("Próximo cambio en 14 días");
      expect(result[0].isOverdue).toBe(false);
    });

    it("marks due-today as close (< 7 days)", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({
            serviceDate: new Date("2026-04-01"),
            nextServiceMonths: 2,
          }), // due 2026-06-01 → 0 days
        ],
      );

      expect(result[0].isClose).toBe(true);
      expect(result[0].urgencyLabel).toBe("Próximo cambio en 0 días");
    });

    it("marks items > 7 days out as not close", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({
            id: 1,
            serviceDate: new Date("2026-05-28"),
            nextServiceMonths: 1,
          }), // due 2026-06-28 → 27 days
          dateItem({
            id: 2,
            serviceDate: new Date("2026-05-25"),
            nextServiceMonths: 1,
          }), // due 2026-06-25 → 24 days
        ],
      );

      expect(result[0].isClose).toBe(false);
      expect(result[1].isClose).toBe(false);
    });

    it("filters out items with null nextServiceMonths", () => {
      const result = buildReminderList(
        [],
        [
          dateItem({ id: 1, nextServiceMonths: null }),
          dateItem({ id: 2, nextServiceMonths: 3 }),
        ],
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe("combined reminders", () => {
    it("places overdue items first regardless of type", () => {
      const result = buildReminderList(
        [
          kmItem({
            id: 1,
            description: "Km upcoming",
            currentKm: 49000,
            nextServiceKm: 50000,
          }), // 1000 km remaining
          kmItem({
            id: 2,
            description: "Km overdue",
            currentKm: 52000,
            nextServiceKm: 50000,
          }), // -2000 km (overdue)
        ],
        [
          dateItem({
            id: 3,
            description: "Date upcoming",
            serviceDate: new Date("2026-05-15"),
            nextServiceMonths: 1,
          }), // due 2026-06-15 → 14 days
          dateItem({
            id: 4,
            description: "Date overdue",
            serviceDate: new Date("2026-03-01"),
            nextServiceMonths: 2,
          }), // due 2026-05-01 → -31 days (overdue)
        ],
      );

      // Overdue items first (sorted by how overdue)
      expect(result[0].description).toBe("Km overdue"); // -2000
      expect(result[1].description).toBe("Date overdue"); // -31

      // Then upcoming (sorted by closeness)
      expect(result[2].description).toBe("Date upcoming"); // 14 days
      expect(result[3].description).toBe("Km upcoming"); // 1000 km
    });

    it("limits to 10 items", () => {
      const kmItems = Array.from({ length: 8 }, (_, i) =>
        kmItem({
          id: i + 1,
          currentKm: 49000 + i * 500,
          nextServiceKm: 50000,
        }),
      );
      const dateItems = Array.from({ length: 5 }, (_, i) =>
        dateItem({
          id: 100 + i,
          serviceDate: new Date("2026-04-01"),
          nextServiceMonths: 2 + i,
        }),
      );

      const result = buildReminderList(kmItems, dateItems);

      expect(result).toHaveLength(10);
    });
  });
});
