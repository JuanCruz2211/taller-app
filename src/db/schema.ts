import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
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
// Better Auth tables (required by the Drizzle adapter)
// ──────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ──────────────────────────────────────────────
// Relations
// ──────────────────────────────────────────────

export const workshopsRelations = relations(workshops, ({ many }) => ({
  users: many(user),
  customers: many(customers),
  vehicles: many(vehicles),
  serviceRecords: many(serviceRecords),
}));

export const userRelations = relations(user, ({ one }) => ({
  workshop: one(workshops, {
    fields: [user.workshopId],
    references: [workshops.id],
  }),
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
