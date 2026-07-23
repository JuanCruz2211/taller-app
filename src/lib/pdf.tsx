import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// ── Font registration ───────────────────────────────────────────────
// Use static fonts from @fontsource/roboto instead of Google Fonts CDN
// because Google now serves Roboto as a variable font (v51+) which
// @react-pdf/renderer cannot parse (RangeError: Offset outside DataView).

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "/fonts/roboto-latin-400-normal.woff2",
      fontWeight: 400,
    },
    {
      src: "/fonts/roboto-latin-700-normal.woff2",
      fontWeight: 700,
    },
  ],
});

// ── Types ────────────────────────────────────────────────────────────

export interface PdfWorkshopData {
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  phone: string;
  address: string | null;
  cuit: string | null;
}

export interface PdfServiceItem {
  id: number;
  description: string;
  category: string | null;
  partCost: string;
  laborCost: string;
  nextServiceKm: number | null;
  nextServiceMonths: number | null;
  sortOrder: number;
}

export interface PdfServiceData {
  id: number;
  date: string;
  mechanicName: string;
  kmAtService: number;
  totalCost: string;
  notes: string | null;
  customerName: string;
  customerPhone: string;
  vehiclePatente: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number | null;
  items: PdfServiceItem[];
}

// ── Styles ───────────────────────────────────────────────────────────

const brandBlue = "#2563eb";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: brandBlue,
    paddingBottom: 14,
  },
  headerLogo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  headerText: {
    textAlign: "right",
  },
  workshopName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  workshopDetail: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: brandBlue,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoBlock: {
    width: "48%",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  tableCellRight: {
    fontSize: 9,
    color: "#1a1a1a",
    textAlign: "right",
  },
  colNum: { width: "5%" },
  colDesc: { width: "35%" },
  colCategory: { width: "15%" },
  colParts: { width: "15%" },
  colLabor: { width: "15%" },
  colTotal: { width: "15%" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
    borderTopWidth: 2,
    borderTopColor: "#d1d5db",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: brandBlue,
    textAlign: "right",
  },
  nextServiceBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
  },
  nextServiceTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 4,
  },
  nextServiceItem: {
    fontSize: 9,
    color: "#92400e",
    marginBottom: 2,
  },
  notesBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(amount: string): string {
  const num = parseFloat(amount) || 0;
  return `$ ${num.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── PDF Document Component ──────────────────────────────────────────

interface ServiceReportProps {
  workshop: PdfWorkshopData;
  service: PdfServiceData;
}

export function ServiceReportDocument({
  workshop,
  service,
}: ServiceReportProps) {
  const hasNextService = service.items.some(
    (i) => i.nextServiceKm || i.nextServiceMonths,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {workshop.logoUrl ? (
            <Image style={styles.headerLogo} src={workshop.logoUrl} />
          ) : (
            <View />
          )}
          <View style={styles.headerText}>
            <Text style={styles.workshopName}>{workshop.name}</Text>
            <Text style={styles.workshopDetail}>
              CUIT: {workshop.cuit ?? "—"}
            </Text>
            <Text style={styles.workshopDetail}>
              Tel: {workshop.phone}
            </Text>
            {workshop.address && (
              <Text style={styles.workshopDetail}>
                {workshop.address}
              </Text>
            )}
          </View>
        </View>

        {/* Report Title */}
        <Text style={styles.title}>Orden de Servicio #{service.id}</Text>
        <Text style={styles.subtitle}>Fecha: {formatDate(service.date)}</Text>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Servicio</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>{service.customerName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{service.customerPhone}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Vehículo</Text>
              <Text style={styles.infoValue}>
                {service.vehicleBrand} {service.vehicleModel}
                {service.vehicleYear ? ` (${service.vehicleYear})` : ""}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Patente</Text>
              <Text style={styles.infoValue}>{service.vehiclePatente}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Mecánico</Text>
              <Text style={styles.infoValue}>{service.mechanicName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>KM en servicio</Text>
              <Text style={styles.infoValue}>
                {service.kmAtService.toLocaleString("es-AR")} km
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items de Servicio</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                Descripción
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colCategory]}>
                Categoría
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colParts]}>
                Repuestos
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colLabor]}>
                Mano de obra
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                Total
              </Text>
            </View>

            {/* Rows */}
            {service.items.map((item, idx) => {
              const part = parseFloat(item.partCost) || 0;
              const labor = parseFloat(item.laborCost) || 0;
              const total = part + labor;
              const isAlt = idx % 2 === 1;

              return (
                <View
                  key={item.id}
                  style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colNum]}>
                    {idx + 1}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDesc]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.tableCell, styles.colCategory]}>
                    {item.category ?? "—"}
                  </Text>
                  <Text style={[styles.tableCellRight, styles.colParts]}>
                    {formatCurrency(item.partCost)}
                  </Text>
                  <Text style={[styles.tableCellRight, styles.colLabor]}>
                    {formatCurrency(item.laborCost)}
                  </Text>
                  <Text style={[styles.tableCellRight, styles.colTotal]}>
                    {formatCurrency(total.toFixed(2))}
                  </Text>
                </View>
              );
            })}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { width: "70%" }]}>
                Total General
              </Text>
              <Text
                style={[
                  styles.totalValue,
                  { width: "30%", textAlign: "right" },
                ]}
              >
                {formatCurrency(service.totalCost)}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Service Intervals */}
        {hasNextService && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Services</Text>
            <View style={styles.nextServiceBox}>
              <Text style={styles.nextServiceTitle}>
                Intervalos recomendados
              </Text>
              {service.items
                .filter((i) => i.nextServiceKm || i.nextServiceMonths)
                .map((item) => (
                  <Text key={item.id} style={styles.nextServiceItem}>
                    • {item.description}:{" "}
                    {item.nextServiceKm && (
                      <Text>{item.nextServiceKm.toLocaleString("es-AR")} km</Text>
                    )}
                    {item.nextServiceKm && item.nextServiceMonths && (
                      <Text> o </Text>
                    )}
                    {item.nextServiceMonths && (
                      <Text>{item.nextServiceMonths} meses</Text>
                    )}
                  </Text>
                ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {service.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{service.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {workshop.name} — Generado el {new Date().toLocaleDateString("es-AR")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
