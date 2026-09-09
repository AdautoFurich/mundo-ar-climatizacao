import { ORDER_STATUS_VALUES, type OrderStatus } from "@/features/ordens-servico/types";
import {
  SERVICE_CATEGORY_VALUES,
  type ServiceCategory,
} from "@/features/servicos/schemas";
import type {
  MostPerformedServiceReportRow,
  MostPerformedServicesReportFilters,
  MostPerformedServicesReportResult,
  OrdersPeriodReportFilters,
  OrdersPeriodReportRow,
  OrdersPeriodReportResult,
  VehicleMaintenanceHistoryFilters,
  VehicleMaintenanceHistoryResult,
  VehicleMaintenanceHistoryRow,
} from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORDER_STATUSES = new Set<string>(ORDER_STATUS_VALUES);
const SERVICE_CATEGORIES = new Set<string>(SERVICE_CATEGORY_VALUES);

function validDate(value: unknown) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10) === value ? value : null;
}

export function sanitizeReportTerm(value: unknown) {
  return (typeof value === "string" ? value : "")
    .trim()
    .replace(/[,%_()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function parseOrdersPeriodReportFilters(input: {
  page?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
  status?: unknown;
  client?: unknown;
  vehicle?: unknown;
  responsibleId?: unknown;
}): OrdersPeriodReportFilters {
  const parsedPage = Number(input.page ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let dateFrom = validDate(input.dateFrom);
  let dateTo = validDate(input.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    dateFrom = null;
    dateTo = null;
  }
  const status =
    input.status === "todas" ||
    (typeof input.status === "string" && ORDER_STATUSES.has(input.status))
      ? (input.status as OrderStatus | "todas")
      : "todas";
  const responsibleId =
    typeof input.responsibleId === "string" && UUID_PATTERN.test(input.responsibleId)
      ? input.responsibleId
      : null;

  return {
    page,
    dateFrom,
    dateTo,
    status,
    client: sanitizeReportTerm(input.client),
    vehicle: sanitizeReportTerm(input.vehicle),
    responsibleId,
  };
}

export function paginateOrdersPeriodReport(
  orders: OrdersPeriodReportRow[],
  page: number,
  pageSize = 15,
): OrdersPeriodReportResult {
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const from = (currentPage - 1) * pageSize;
  return {
    orders: orders.slice(from, from + pageSize),
    total,
    totalValue: orders.reduce((sum, order) => sum + order.total, 0),
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export function ordersPeriodReportUrl(filters: OrdersPeriodReportFilters, page = 1) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("de", filters.dateFrom);
  if (filters.dateTo) params.set("ate", filters.dateTo);
  if (filters.status !== "todas") params.set("situacao", filters.status);
  if (filters.client) params.set("cliente", filters.client);
  if (filters.vehicle) params.set("veiculo", filters.vehicle);
  if (filters.responsibleId) params.set("responsavel", filters.responsibleId);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/relatorios/ordens-periodo?${query}` : "/relatorios/ordens-periodo";
}

export function parseMostPerformedServicesReportFilters(input: {
  page?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
  search?: unknown;
  category?: unknown;
}): MostPerformedServicesReportFilters {
  const parsedPage = Number(input.page ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let dateFrom = validDate(input.dateFrom);
  let dateTo = validDate(input.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    dateFrom = null;
    dateTo = null;
  }
  const category =
    input.category === "todas" ||
    (typeof input.category === "string" && SERVICE_CATEGORIES.has(input.category))
      ? (input.category as ServiceCategory | "todas")
      : "todas";

  return {
    page,
    dateFrom,
    dateTo,
    search: sanitizeReportTerm(input.search),
    category,
  };
}

export function paginateMostPerformedServicesReport(
  services: MostPerformedServiceReportRow[],
  page: number,
  pageSize = 15,
): MostPerformedServicesReportResult {
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const totalServices = services.length;
  const totalPages = Math.max(1, Math.ceil(totalServices / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const from = (currentPage - 1) * pageSize;

  return {
    services: services.slice(from, from + pageSize),
    totalServices,
    totalOrders: services.reduce((sum, service) => sum + service.ordersCount, 0),
    totalQuantity: services.reduce((sum, service) => sum + service.quantity, 0),
    totalValue: services.reduce((sum, service) => sum + service.totalValue, 0),
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export function aggregateMostPerformedServices(
  items: Array<{
    serviceId: string;
    orderId: string;
    quantity: number;
    totalValue: number;
  }>,
  catalog: Array<{
    id: string;
    name: string;
    category: ServiceCategory;
  }>,
  filters: Pick<MostPerformedServicesReportFilters, "category" | "search">,
) {
  const search = filters.search.toLocaleLowerCase("pt-BR");
  const filteredCatalog = new Map(
    catalog
      .filter((service) => filters.category === "todas" || service.category === filters.category)
      .filter((service) => !search || service.name.toLocaleLowerCase("pt-BR").includes(search))
      .map((service) => [service.id, service]),
  );
  const grouped = new Map<
    string,
    MostPerformedServiceReportRow & { orderIds: Set<string> }
  >();

  for (const item of items) {
    const service = filteredCatalog.get(item.serviceId);
    if (!service) continue;
    const current = grouped.get(service.id) ?? {
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      ordersCount: 0,
      quantity: 0,
      totalValue: 0,
      orderIds: new Set<string>(),
    };
    current.quantity += item.quantity;
    current.totalValue += item.totalValue;
    current.orderIds.add(item.orderId);
    grouped.set(service.id, current);
  }

  return [...grouped.values()]
    .map(({ orderIds, ...service }) => ({
      ...service,
      ordersCount: orderIds.size,
    }))
    .sort(
      (first, second) =>
        second.quantity - first.quantity ||
        second.totalValue - first.totalValue ||
        first.serviceName.localeCompare(second.serviceName, "pt-BR"),
    );
}

export function mostPerformedServicesReportUrl(
  filters: MostPerformedServicesReportFilters,
  page = 1,
) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("de", filters.dateFrom);
  if (filters.dateTo) params.set("ate", filters.dateTo);
  if (filters.search) params.set("busca", filters.search);
  if (filters.category !== "todas") params.set("categoria", filters.category);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query
      ? `/relatorios/servicos-mais-realizados?${query}`
      : "/relatorios/servicos-mais-realizados";
}

export function parseVehicleMaintenanceHistoryFilters(input: {
  page?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
  vehicleId?: unknown;
}): VehicleMaintenanceHistoryFilters {
  const parsedPage = Number(input.page ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let dateFrom = validDate(input.dateFrom);
  let dateTo = validDate(input.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    dateFrom = null;
    dateTo = null;
  }
  const vehicleId =
    typeof input.vehicleId === "string" && UUID_PATTERN.test(input.vehicleId)
      ? input.vehicleId
      : null;

  return { page, dateFrom, dateTo, vehicleId };
}

export function paginateVehicleMaintenanceHistory(
  maintenances: VehicleMaintenanceHistoryRow[],
  page: number,
  pageSize = 15,
): VehicleMaintenanceHistoryResult {
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const total = maintenances.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const from = (currentPage - 1) * pageSize;

  return {
    maintenances: maintenances.slice(from, from + pageSize),
    total,
    totalValue: maintenances.reduce(
      (sum, maintenance) => sum + maintenance.totalValue,
      0,
    ),
    latestMileage: maintenances[0]?.mileage ?? null,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export function vehicleMaintenanceHistoryUrl(
  filters: VehicleMaintenanceHistoryFilters,
  page = 1,
) {
  const params = new URLSearchParams();
  if (filters.vehicleId) params.set("veiculo", filters.vehicleId);
  if (filters.dateFrom) params.set("de", filters.dateFrom);
  if (filters.dateTo) params.set("ate", filters.dateTo);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query
    ? `/relatorios/historico-veiculos?${query}`
    : "/relatorios/historico-veiculos";
}
