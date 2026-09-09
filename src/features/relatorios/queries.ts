import "server-only";

import { buildOrderDateRange } from "@/features/ordens-servico/query-helpers";
import type { OrderStatus } from "@/features/ordens-servico/types";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  aggregateMostPerformedServices,
  paginateMostPerformedServicesReport,
  paginateOrdersPeriodReport,
  paginateVehicleMaintenanceHistory,
  parseMostPerformedServicesReportFilters,
  parseOrdersPeriodReportFilters,
  parseVehicleMaintenanceHistoryFilters,
} from "./query-helpers";
import type {
  MostPerformedServicesReportFilters,
  MostPerformedServicesReportResult,
  OrdersPeriodReportFilters,
  OrdersPeriodReportResult,
  OrdersPeriodReportRow,
  ReportResponsibleOption,
  ReportVehicleOption,
  VehicleMaintenanceHistoryFilters,
  VehicleMaintenanceHistoryResult,
  VehicleMaintenanceHistoryRow,
} from "./types";

type OrderRow = Database["public"]["Tables"]["ordens_servico"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["ordens_servico_itens"]["Row"];
type ServiceRow = Database["public"]["Tables"]["servicos"]["Row"];
type DeliveryRow = Database["public"]["Tables"]["ordens_servico_entregas"]["Row"];
type VehicleRow = Database["public"]["Tables"]["veiculos"]["Row"];
type ReportOrderDatabaseRow = Pick<
  OrderRow,
  | "id"
  | "numero"
  | "situacao"
  | "cliente_nome"
  | "veiculo_placa"
  | "veiculo_marca"
  | "veiculo_modelo"
  | "responsavel_id"
  | "entrada_em"
  | "total_final"
>;

const REPORT_FIELDS =
  "id, numero, situacao, cliente_nome, veiculo_placa, veiculo_marca, veiculo_modelo, responsavel_id, entrada_em, total_final";
const BATCH_SIZE = 1000;
const SERVICE_BATCH_SIZE = 500;

function moneyToCents(value: number) {
  return Math.round(Number(value) * 100);
}

async function loadResponsibleNames(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis_usuarios")
    .select("id, nome")
    .in("id", uniqueIds);
  if (error) throw new Error("Não foi possível carregar os responsáveis do relatório.");
  return new Map((data ?? []).map((responsible) => [responsible.id, responsible.nome]));
}

export async function listOrdersPeriodReport(
  input: Partial<OrdersPeriodReportFilters> = {},
): Promise<OrdersPeriodReportResult> {
  await requirePermission("relatorios:consultar");
  const filters = parseOrdersPeriodReportFilters(input);
  const range = buildOrderDateRange(filters.dateFrom, filters.dateTo);
  const supabase = await createClient();
  const rows: ReportOrderDatabaseRow[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("ordens_servico")
      .select(REPORT_FIELDS)
      .order("entrada_em", { ascending: false })
      .order("numero", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (filters.status !== "todas") query = query.eq("situacao", filters.status);
    if (filters.responsibleId) query = query.eq("responsavel_id", filters.responsibleId);
    if (range.from) query = query.gte("entrada_em", range.from);
    if (range.until) query = query.lt("entrada_em", range.until);
    if (filters.client) query = query.ilike("cliente_nome", `%${filters.client}%`);
    if (filters.vehicle) {
      const plate = filters.vehicle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const expressions = [
        `veiculo_marca.ilike.%${filters.vehicle}%`,
        `veiculo_modelo.ilike.%${filters.vehicle}%`,
      ];
      if (plate) expressions.push(`veiculo_placa.ilike.%${plate}%`);
      query = query.or(expressions.join(","));
    }

    const { data, error } = await query;
    if (error) throw new Error("Não foi possível carregar o relatório de ordens.");
    const batch = (data ?? []) as unknown as ReportOrderDatabaseRow[];
    rows.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  const names = await loadResponsibleNames(rows.map((row) => row.responsavel_id));
  const orders: OrdersPeriodReportRow[] = rows.map((row) => ({
    id: row.id,
    number: row.numero,
    entryAt: row.entrada_em,
    clientName: row.cliente_nome,
    vehicleLabel: `${row.veiculo_marca} ${row.veiculo_modelo}`,
    vehiclePlate: row.veiculo_placa,
    status: row.situacao as OrderStatus,
    responsibleName: names.get(row.responsavel_id) ?? "Usuário não encontrado",
    total: moneyToCents(row.total_final),
  }));
  return paginateOrdersPeriodReport(orders, filters.page);
}

export async function listReportResponsibles(): Promise<ReportResponsibleOption[]> {
  await requirePermission("relatorios:consultar");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis_usuarios")
    .select("id, nome")
    .order("nome")
    .limit(500);
  if (error) throw new Error("Não foi possível carregar os responsáveis.");
  return (data ?? []).map((responsible) => ({
    id: responsible.id,
    name: responsible.nome,
  }));
}

type ExecutedServiceItemRow = Pick<
  OrderItemRow,
  "servico_id" | "ordem_servico_id" | "quantidade" | "subtotal" | "executado_em"
>;
type ReportServiceRow = Pick<ServiceRow, "id" | "nome" | "categoria">;

async function loadReportServices(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids)];
  const services: ReportServiceRow[] = [];
  const supabase = await createClient();

  for (let offset = 0; offset < uniqueIds.length; offset += SERVICE_BATCH_SIZE) {
    const { data, error } = await supabase
      .from("servicos")
      .select("id, nome, categoria")
      .in("id", uniqueIds.slice(offset, offset + SERVICE_BATCH_SIZE));
    if (error) throw new Error("Não foi possível carregar os serviços do relatório.");
    services.push(...((data ?? []) as ReportServiceRow[]));
  }

  return services;
}

export async function listMostPerformedServicesReport(
  input: Partial<MostPerformedServicesReportFilters> = {},
): Promise<MostPerformedServicesReportResult> {
  await requirePermission("relatorios:consultar");
  const filters = parseMostPerformedServicesReportFilters(input);
  const range = buildOrderDateRange(filters.dateFrom, filters.dateTo);
  const supabase = await createClient();
  const items: ExecutedServiceItemRow[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("ordens_servico_itens")
      .select("servico_id, ordem_servico_id, quantidade, subtotal, executado_em")
      .eq("tipo", "servico")
      .eq("situacao_aprovacao", "aprovado")
      .is("removido_em", null)
      .not("executado_em", "is", null)
      .order("executado_em", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (range.from) query = query.gte("executado_em", range.from);
    if (range.until) query = query.lt("executado_em", range.until);

    const { data, error } = await query;
    if (error) throw new Error("Não foi possível carregar o relatório de serviços.");
    const batch = (data ?? []) as ExecutedServiceItemRow[];
    items.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  const catalog = await loadReportServices(
    items.flatMap((item) => (item.servico_id ? [item.servico_id] : [])),
  );
  const services = aggregateMostPerformedServices(
    items.flatMap((item) =>
      item.servico_id
        ? [{
            serviceId: item.servico_id,
            orderId: item.ordem_servico_id,
            quantity: Number(item.quantidade),
            totalValue: moneyToCents(item.subtotal ?? 0),
          }]
        : [],
    ),
    catalog.map((service) => ({
      id: service.id,
      name: service.nome,
      category: service.categoria,
    })),
    filters,
  );

  return paginateMostPerformedServicesReport(services, filters.page);
}

type MaintenanceOrderRow = Pick<
  OrderRow,
  | "id"
  | "numero"
  | "situacao"
  | "cliente_nome"
  | "quilometragem"
  | "entrada_em"
  | "total_final"
>;
type MaintenanceItemRow = Pick<
  OrderItemRow,
  "ordem_servico_id" | "descricao" | "quantidade" | "ordem"
>;
type MaintenanceDeliveryRow = Pick<DeliveryRow, "ordem_servico_id" | "entregue_em">;

function emptyVehicleMaintenanceHistory(
  page: number,
): VehicleMaintenanceHistoryResult {
  return {
    maintenances: [],
    total: 0,
    totalValue: 0,
    latestMileage: null,
    page,
    pageSize: 15,
    totalPages: 1,
  };
}

function formatServiceQuantity(quantity: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(quantity);
}

export async function listReportVehicles(): Promise<ReportVehicleOption[]> {
  await requirePermission("relatorios:consultar");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("id, placa, marca, modelo")
    .order("placa")
    .limit(1000);
  if (error) throw new Error("Não foi possível carregar os veículos.");
  return ((data ?? []) as Pick<VehicleRow, "id" | "placa" | "marca" | "modelo">[]).map(
    (vehicle) => ({
      id: vehicle.id,
      plate: vehicle.placa,
      label: `${vehicle.placa} · ${vehicle.marca} ${vehicle.modelo}`,
    }),
  );
}

export async function listVehicleMaintenanceHistory(
  input: Partial<VehicleMaintenanceHistoryFilters> = {},
): Promise<VehicleMaintenanceHistoryResult> {
  await requirePermission("relatorios:consultar");
  const filters = parseVehicleMaintenanceHistoryFilters(input);
  if (!filters.vehicleId) return emptyVehicleMaintenanceHistory(filters.page);

  const range = buildOrderDateRange(filters.dateFrom, filters.dateTo);
  const supabase = await createClient();
  const orders: MaintenanceOrderRow[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("ordens_servico")
      .select("id, numero, situacao, cliente_nome, quilometragem, entrada_em, total_final")
      .eq("veiculo_id", filters.vehicleId)
      .order("entrada_em", { ascending: false })
      .order("numero", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);
    if (range.from) query = query.gte("entrada_em", range.from);
    if (range.until) query = query.lt("entrada_em", range.until);

    const { data, error } = await query;
    if (error) throw new Error("Não foi possível carregar o histórico do veículo.");
    const batch = (data ?? []) as MaintenanceOrderRow[];
    orders.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  if (orders.length === 0) return emptyVehicleMaintenanceHistory(filters.page);

  const items: MaintenanceItemRow[] = [];
  const deliveries: MaintenanceDeliveryRow[] = [];
  const orderIds = orders.map((order) => order.id);
  for (let start = 0; start < orderIds.length; start += SERVICE_BATCH_SIZE) {
    const ids = orderIds.slice(start, start + SERVICE_BATCH_SIZE);
    const [itemsResult, deliveriesResult] = await Promise.all([
      supabase
        .from("ordens_servico_itens")
        .select("ordem_servico_id, descricao, quantidade, ordem")
        .in("ordem_servico_id", ids)
        .eq("tipo", "servico")
        .eq("situacao_aprovacao", "aprovado")
        .is("removido_em", null)
        .not("executado_em", "is", null)
        .order("ordem"),
      supabase
        .from("ordens_servico_entregas")
        .select("ordem_servico_id, entregue_em")
        .in("ordem_servico_id", ids),
    ]);
    if (itemsResult.error || deliveriesResult.error) {
      throw new Error("Não foi possível carregar os detalhes das manutenções.");
    }
    items.push(...((itemsResult.data ?? []) as MaintenanceItemRow[]));
    deliveries.push(...((deliveriesResult.data ?? []) as MaintenanceDeliveryRow[]));
  }

  const servicesByOrder = new Map<string, string[]>();
  for (const item of items) {
    const services = servicesByOrder.get(item.ordem_servico_id) ?? [];
    services.push(
      Number(item.quantidade) === 1
        ? item.descricao
        : `${item.descricao} (${formatServiceQuantity(Number(item.quantidade))}x)`,
    );
    servicesByOrder.set(item.ordem_servico_id, services);
  }
  const deliveryByOrder = new Map(
    deliveries.map((delivery) => [delivery.ordem_servico_id, delivery.entregue_em]),
  );
  const maintenances: VehicleMaintenanceHistoryRow[] = orders.flatMap((order) => {
    const services = servicesByOrder.get(order.id);
    if (!services?.length) return [];
    return [{
      id: order.id,
      number: order.numero,
      entryAt: order.entrada_em,
      deliveredAt: deliveryByOrder.get(order.id) ?? null,
      clientName: order.cliente_nome,
      mileage: order.quilometragem,
      services,
      status: order.situacao as OrderStatus,
      totalValue: moneyToCents(order.total_final),
    }];
  });

  return paginateVehicleMaintenanceHistory(maintenances, filters.page);
}
