export type KmReminderRow = {
  id: number;
  description: string;
  nextServiceKm: number | null;
  currentKm: number | null;
  serviceDate: Date;
  serviceRecordId: number;
  vehiclePatente: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleId: number;
  customerName: string;
};

export type DateReminderRow = {
  id: number;
  description: string;
  serviceDate: Date;
  nextServiceMonths: number | null;
  serviceRecordId: number;
  vehiclePatente: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleId: number;
  customerName: string;
};

export type ReminderCard = {
  id: number;
  type: "km" | "date";
  description: string;
  vehiclePatente: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleId: number;
  customerName: string;
  isOverdue: boolean;
  isClose: boolean;
  urgencyLabel: string;
  sortKey: number;
};

export function buildReminderList(
  kmItems: KmReminderRow[],
  dateItems: DateReminderRow[],
): ReminderCard[] {
  const now = new Date();
  const reminders: ReminderCard[] = [];

  for (const item of kmItems) {
    if (item.nextServiceKm === null || item.currentKm === null) continue;
    const remainingKm = item.nextServiceKm - item.currentKm;
    reminders.push({
      id: item.id,
      type: "km",
      description: item.description,
      vehiclePatente: item.vehiclePatente,
      vehicleBrand: item.vehicleBrand,
      vehicleModel: item.vehicleModel,
      vehicleId: item.vehicleId,
      customerName: item.customerName,
      isOverdue: remainingKm < 0,
      isClose: remainingKm < 500,
      urgencyLabel:
        remainingKm < 0
          ? `VENCIDO por ${Math.abs(remainingKm)} km`
          : `Próximo cambio en ${remainingKm} km`,
      sortKey: remainingKm,
    });
  }

  for (const item of dateItems) {
    if (item.nextServiceMonths === null) continue;
    const dueDate = new Date(item.serviceDate);
    dueDate.setMonth(dueDate.getMonth() + item.nextServiceMonths);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    reminders.push({
      id: item.id,
      type: "date",
      description: item.description,
      vehiclePatente: item.vehiclePatente,
      vehicleBrand: item.vehicleBrand,
      vehicleModel: item.vehicleModel,
      vehicleId: item.vehicleId,
      customerName: item.customerName,
      isOverdue: daysRemaining < 0,
      isClose: daysRemaining < 7,
      urgencyLabel:
        daysRemaining < 0
          ? `VENCIDO hace ${Math.abs(daysRemaining)} días`
          : `Próximo cambio en ${daysRemaining} días`,
      sortKey: daysRemaining,
    });
  }

  // Sort: overdue first (most overdue first), then soonest upcoming first
  reminders.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.sortKey - b.sortKey;
  });

  return reminders.slice(0, 10);
}
