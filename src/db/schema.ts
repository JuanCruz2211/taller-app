import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  decimal,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export const serviceStatus = pgEnum("service_status", ["draft", "finalized"]);

// ──────────────────────────────────────────────
// Tables
// ──────────────────────────────────────────────

export const workshops = pgTable("workshops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color"),
  cuit: text("cuit"),
  phone: text("phone").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const presaleSignups = pgTable("presale_signups", {
  id: serial("id").primaryKey(),
  workshopName: text("workshop_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id")
    .notNull()
    .references(() => workshops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    workshopId: integer("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    patente: text("patente").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    year: integer("year"),
    currentKm: integer("current_km"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patentePerWorkshop: uniqueIndex("patente_per_workshop").on(
      table.workshopId,
      table.patente
    ),
  })
);

export const serviceRecords = pgTable("service_records", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id")
    .notNull()
    .references(() => workshops.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  mechanicName: text("mechanic_name").notNull(),
  kmAtService: integer("km_at_service").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: serviceStatus("status").default("draft").notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceItems = pgTable("service_items", {
  id: serial("id").primaryKey(),
  serviceRecordId: integer("service_record_id")
    .notNull()
    .references(() => serviceRecords.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  category: text("category"),
  partCost: decimal("part_cost", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  nextServiceKm: integer("next_service_km"),
  nextServiceMonths: integer("next_service_months"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ──────────────────────────────────────────────
// Relations
// ──────────────────────────────────────────────

export const workshopsRelations = relations(workshops, ({ many }) => ({
  customers: many(customers),
  vehicles: many(vehicles),
  serviceRecords: many(serviceRecords),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [customers.workshopId],
    references: [workshops.id],
  }),
  vehicles: many(vehicles),
  serviceRecords: many(serviceRecords),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  workshop: one(workshops, {
    fields: [vehicles.workshopId],
    references: [workshops.id],
  }),
  customer: one(customers, {
    fields: [vehicles.customerId],
    references: [customers.id],
  }),
  serviceRecords: many(serviceRecords),
}));

export const serviceRecordsRelations = relations(
  serviceRecords,
  ({ one, many }) => ({
    workshop: one(workshops, {
      fields: [serviceRecords.workshopId],
      references: [workshops.id],
    }),
    vehicle: one(vehicles, {
      fields: [serviceRecords.vehicleId],
      references: [vehicles.id],
    }),
    customer: one(customers, {
      fields: [serviceRecords.customerId],
      references: [customers.id],
    }),
    serviceItems: many(serviceItems),
  })
);

export const serviceItemsRelations = relations(serviceItems, ({ one }) => ({
  serviceRecord: one(serviceRecords, {
    fields: [serviceItems.serviceRecordId],
    references: [serviceRecords.id],
  }),
}));
