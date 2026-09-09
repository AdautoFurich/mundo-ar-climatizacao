import "server-only";

import { isOrderOverdue } from "@/features/ordens-servico/query-helpers";
import type { OrderStatus } from "@/features/ordens-servico/types";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  buildDashboardAttentionItems,
  buildDashboardNextActions,
  buildDashboardStatusCounts,
  DASHBOARD_ACTIVE_STATUSES,
  getDashboardDayRange,
  isDashboardAttentionOrder,
} from "./helpers";
import type { DashboardData, DashboardOrder } from "./types";

type OrderRow = Database["public"]["Tables"]["ordens_servico"]["Row"];
type DashboardOrderRow = Pick<
  OrderRow,
  | "id"
  | "numero"
  | "situacao"
  | "cliente_nome"
  | "cliente_telefone"
  | "veiculo_placa"
  | "veiculo_marca"
  | "veiculo_modelo"
  | "veiculo_ano_fabricacao"
  | "veiculo_ano_modelo"
  | "responsavel_id"
  | "entrada_em"
  | "previsao_conclusao_em"
  | "total_autorizado"
>;

const DASHBOARD_ORDER_FIELDS =
  "id, numero, situacao, cliente_nome, cliente_telefone, veiculo_placa, veiculo_marca, veiculo_modelo, veiculo_ano_fabricacao, veiculo_ano_modelo, responsavel_id, entrada_em, previsao_conclusao_em, total_autorizado";
const BATCH_SIZE = 1000;

function moneyToCents(value: number) {
  return Math.round(Number(value) * 100);
}

async function loadUserNames(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis_usuarios")
    .select("id, nome")
    .in("id", uniqueIds);
  if (error) throw new Error("Não foi possível carregar os responsáveis do painel.");
  return new Map((data ?? []).map((user) => [user.id, user.nome]));
}

function mapOrder(
  row: DashboardOrderRow,
  names: ReadonlyMap<string, string>,
  now: Date,
): DashboardOrder {
  const status = row.situacao as OrderStatus;
  return {
    id: row.id,
    number: row.numero,
    status,
    clientName: row.cliente_nome,
    clientPhone: row.cliente_telefone,
    vehicleLabel: `${row.veiculo_marca} ${row.veiculo_modelo}`,
    vehiclePlate: row.veiculo_placa,
    vehicleYear: `${row.veiculo_ano_fabricacao}/${row.veiculo_ano_modelo}`,
    responsibleName: names.get(row.responsavel_id) ?? "Usuário não encontrado",
    entryAt: row.entrada_em,
    expectedCompletionAt: row.previsao_conclusao_em,
    authorizedTotal: moneyToCents(row.total_autorizado),
    overdue: isOrderOverdue(status, row.previsao_conclusao_em, now),
  };
}

async function loadOperationalRows() {
  const supabase = await createClient();
  const rows: DashboardOrderRow[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select(DASHBOARD_ORDER_FIELDS)
      .in("situacao", [...DASHBOARD_ACTIVE_STATUSES])
      .order("entrada_em", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) throw new Error("Não foi possível carregar as ordens em andamento.");
    const batch = (data ?? []) as DashboardOrderRow[];
    rows.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }
  return rows;
}

async function loadDeliveredToday(from: string, until: string) {
  const supabase = await createClient();
  const orderIds: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ordens_servico_entregas")
      .select("ordem_servico_id")
      .gte("entregue_em", from)
      .lt("entregue_em", until)
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) throw new Error("Não foi possível calcular as entregas de hoje.");
    const batch = data ?? [];
    orderIds.push(...batch.map((delivery) => delivery.ordem_servico_id));
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  if (orderIds.length === 0) return { count: 0, revenue: 0 };
  let revenue = 0;
  for (let start = 0; start < orderIds.length; start += BATCH_SIZE) {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("total_final")
      .in("id", orderIds.slice(start, start + BATCH_SIZE));
    if (error) throw new Error("Não foi possível calcular o faturamento de hoje.");
    revenue += (data ?? []).reduce(
      (sum, order) => sum + moneyToCents(order.total_final),
      0,
    );
  }
  return { count: orderIds.length, revenue };
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
  await requirePermission("ordens:consultar");
  const supabase = await createClient();
  const range = getDashboardDayRange(now);
  if (!range.from || !range.until) throw new Error("Não foi possível determinar a data de hoje.");

  const [operationalRows, recentResult, openedResult, delivered] = await Promise.all([
    loadOperationalRows(),
    supabase
      .from("ordens_servico")
      .select(DASHBOARD_ORDER_FIELDS)
      .order("entrada_em", { ascending: false })
      .order("numero", { ascending: false })
      .limit(5),
    supabase
      .from("ordens_servico")
      .select("id", { count: "exact", head: true })
      .gte("entrada_em", range.from)
      .lt("entrada_em", range.until),
    loadDeliveredToday(range.from, range.until),
  ]);
  if (recentResult.error || openedResult.error) {
    throw new Error("Não foi possível carregar os indicadores do painel.");
  }

  const recentRows = (recentResult.data ?? []) as DashboardOrderRow[];
  const names = await loadUserNames(
    [...operationalRows, ...recentRows].map((order) => order.responsavel_id),
  );
  const operationalOrders = operationalRows.map((order) => mapOrder(order, names, now));
  const recentOrders = recentRows.map((order) => mapOrder(order, names, now));

  return {
    statusCounts: buildDashboardStatusCounts(operationalOrders),
    recentOrders,
    daily: {
      opened: openedResult.count ?? 0,
      delivered: delivered.count,
      revenue: delivered.revenue,
      averageTicket:
        delivered.count === 0 ? 0 : Math.round(delivered.revenue / delivered.count),
    },
    attentionTotal: operationalOrders.filter(isDashboardAttentionOrder).length,
    attentionItems: buildDashboardAttentionItems(operationalOrders),
    nextActions: buildDashboardNextActions(operationalOrders),
  };
}
