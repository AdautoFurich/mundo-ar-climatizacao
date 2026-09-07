import type { OrderStatus } from "@/features/ordens-servico/types";
import type { ServiceCategory } from "@/features/servicos/schemas";

export type OrdersPeriodReportFilters = {
  page: number;
  dateFrom: string | null;
  dateTo: string | null;
  status: OrderStatus | "todas";
  client: string;
  vehicle: string;
  responsibleId: string | null;
};

export type OrdersPeriodReportRow = {
  id: string;
  number: number;
  entryAt: string;
  clientName: string;
  vehicleLabel: string;
  vehiclePlate: string;
  status: OrderStatus;
  responsibleName: string;
  total: number;
};

export type OrdersPeriodReportResult = {
  orders: OrdersPeriodReportRow[];
  total: number;
  totalValue: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ReportResponsibleOption = {
  id: string;
  name: string;
};

export type MostPerformedServicesReportFilters = {
  page: number;
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
  category: ServiceCategory | "todas";
};

export type MostPerformedServiceReportRow = {
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  ordersCount: number;
  quantity: number;
  totalValue: number;
};

export type MostPerformedServicesReportResult = {
  services: MostPerformedServiceReportRow[];
  totalServices: number;
  totalOrders: number;
  totalQuantity: number;
  totalValue: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type VehicleMaintenanceHistoryFilters = {
  page: number;
  dateFrom: string | null;
  dateTo: string | null;
  vehicleId: string | null;
};

export type VehicleMaintenanceHistoryRow = {
  id: string;
  number: number;
  entryAt: string;
  deliveredAt: string | null;
  clientName: string;
  mileage: number;
  services: string[];
  status: OrderStatus;
  totalValue: number;
};

export type VehicleMaintenanceHistoryResult = {
  maintenances: VehicleMaintenanceHistoryRow[];
  total: number;
  totalValue: number;
  latestMileage: number | null;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ReportVehicleOption = {
  id: string;
  label: string;
  plate: string;
};
