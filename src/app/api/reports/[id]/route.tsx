import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  serviceRecords,
  serviceItems,
  customers,
  vehicles,
  workshops,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  ServiceReportDocument,
  type PdfWorkshopData,
  type PdfServiceData,
  type PdfServiceItem,
} from "@/lib/pdf";

// ── GET /api/reports/[id] ────────────────────────────────────────────
// Genera y descarga un PDF del service record finalizado.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const workshopId = Number(session.user.id);
    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Obtener datos del taller
    const [workshop] = await db
      .select()
      .from(workshops)
      .where(eq(workshops.id, workshopId))
      .limit(1);

    if (!workshop) {
      return Response.json(
        { error: "Taller no encontrado" },
        { status: 404 },
      );
    }

    // Obtener service record con joins
    const [record] = await db
      .select({
        id: serviceRecords.id,
        workshopId: serviceRecords.workshopId,
        vehicleId: serviceRecords.vehicleId,
        customerId: serviceRecords.customerId,
        mechanicName: serviceRecords.mechanicName,
        kmAtService: serviceRecords.kmAtService,
        date: serviceRecords.date,
        status: serviceRecords.status,
        totalCost: serviceRecords.totalCost,
        notes: serviceRecords.notes,
        createdAt: serviceRecords.createdAt,
        updatedAt: serviceRecords.updatedAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        vehiclePatente: vehicles.patente,
        vehicleBrand: vehicles.brand,
        vehicleModel: vehicles.model,
        vehicleYear: vehicles.year,
      })
      .from(serviceRecords)
      .leftJoin(customers, eq(serviceRecords.customerId, customers.id))
      .leftJoin(vehicles, eq(serviceRecords.vehicleId, vehicles.id))
      .where(
        and(
          eq(serviceRecords.id, serviceId),
          eq(serviceRecords.workshopId, workshopId),
        ),
      )
      .limit(1);

    if (!record) {
      return Response.json(
        { error: "Service no encontrado" },
        { status: 404 },
      );
    }

    // Solo se puede generar PDF de servicios finalizados
    if (record.status !== "finalized") {
      return Response.json(
        { error: "Solo se puede generar el reporte de servicios finalizados" },
        { status: 409 },
      );
    }

    // Obtener items
    const items = await db
      .select()
      .from(serviceItems)
      .where(eq(serviceItems.serviceRecordId, serviceId))
      .orderBy(asc(serviceItems.sortOrder));

    // Armar datos para el PDF
    const pdfWorkshop: PdfWorkshopData = {
      name: workshop.name,
      logoUrl: workshop.logoUrl,
      brandColor: workshop.brandColor,
      phone: workshop.phone,
      address: workshop.address,
      cuit: workshop.cuit,
    };

    const pdfItems: PdfServiceItem[] = items.map((item) => ({
      id: item.id,
      description: item.description,
      category: item.category,
      partCost: item.partCost,
      laborCost: item.laborCost,
      nextServiceKm: item.nextServiceKm,
      nextServiceMonths: item.nextServiceMonths,
      sortOrder: item.sortOrder,
    }));

    const pdfService: PdfServiceData = {
      id: record.id,
      date: record.date.toISOString(),
      mechanicName: record.mechanicName,
      kmAtService: record.kmAtService,
      totalCost: record.totalCost,
      notes: record.notes,
      customerName: record.customerName ?? "—",
      customerPhone: record.customerPhone ?? "—",
      vehiclePatente: record.vehiclePatente ?? "—",
      vehicleBrand: record.vehicleBrand ?? "—",
      vehicleModel: record.vehicleModel ?? "",
      vehicleYear: record.vehicleYear,
      items: pdfItems,
    };

    // Generar PDF
    const pdfBuffer = await renderToBuffer(
      <ServiceReportDocument workshop={pdfWorkshop} service={pdfService} />,
    );

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-${serviceId}.pdf"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
