import "server-only";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { orderIdSchema } from "./schemas";
import {
  buildOrderDateRange,
  isOrderOverdue,
  parseOrderListFilters,
  parseOrderNumberSearch,
  sanitizeOrderSearch,
  type OrderListFilters,
} from "./query-helpers";
import type {
  ApprovalChannel,
  ApprovalStatus,
  FuelLevel,
  OrderApproval,
  OrderClientOption,
  OrderDelivery,
  OrderDiagnosis,
  OrderHistoryEvent,
  OrderItemType,
  OrderResponsibleOption,
  OrderServiceOption,
  OrderStatus,
  OrderVehicleOption,
  PaymentMethod,
  ServiceOrderDetails,
  ServiceOrderItem,
  ServiceOrderListResult,
  ServiceOrderSummary,
} from "./types";

type OrderRow = Database["public"]["Tables"]["ordens_servico"]["Row"];
type DiagnosisRow =
  Database["public"]["Tables"]["ordens_servico_diagnosticos"]["Row"];
type ItemRow =
  Database["public"]["Tables"]["ordens_servico_itens"]["Row"];
type ApprovalRow =
  Database["public"]["Tables"]["ordens_servico_aprovacoes"]["Row"];
type DeliveryRow =
  Database["public"]["Tables"]["ordens_servico_entregas"]["Row"];
type HistoryRow =
  Database["public"]["Tables"]["ordens_servico_historico"]["Row"];

const ORDER_LIST_FIELDS =
  "id, numero, situacao, cliente_id, cliente_nome, veiculo_id, veiculo_placa, veiculo_marca, veiculo_modelo, responsavel_id, entrada_em, previsao_conclusao_em, total_autorizado, atualizado_em";
const ORDER_DETAIL_FIELDS =
  "id, numero, situacao, cliente_id, cliente_nome, cliente_cpf, cliente_telefone, veiculo_id, veiculo_placa, veiculo_marca, veiculo_modelo, veiculo_ano_fabricacao, veiculo_ano_modelo, responsavel_id, entrada_em, previsao_conclusao_em, quilometragem, nivel_combustivel, relato_cliente, acessorios, avarias_visiveis, observacoes_entrada, subtotal_servicos, subtotal_materiais, subtotal_orcado, subtotal_autorizado, desconto, total_orcado, total_autorizado, total_final, versao, criado_por, atualizado_por, criado_em, atualizado_em";

function userName(names: ReadonlyMap<string, string>, id: string) {
  return names.get(id) ?? "Usuário não encontrado";
}

function moneyToCents(value: number) {
  return Math.round(Number(value) * 100);
}

function toSummary(
  row: Pick<
    OrderRow,
    | "id"
    | "numero"
    | "situacao"
    | "cliente_id"
    | "cliente_nome"
    | "veiculo_id"
    | "veiculo_placa"
    | "veiculo_marca"
    | "veiculo_modelo"
    | "responsavel_id"
    | "entrada_em"
    | "previsao_conclusao_em"
    | "total_autorizado"
    | "atualizado_em"
  >,
  responsibleName: string,
  now = new Date(),
): ServiceOrderSummary {
  const status = row.situacao as OrderStatus;
  return {
    id: row.id,
    number: row.numero,
    status,
    clientId: row.cliente_id,
    clientName: row.cliente_nome,
    vehicleId: row.veiculo_id,
    vehiclePlate: row.veiculo_placa,
    vehicleLabel: `${row.veiculo_marca} ${row.veiculo_modelo}`,
    responsibleId: row.responsavel_id,
    responsibleName,
    entryAt: row.entrada_em,
    expectedCompletionAt: row.previsao_conclusao_em,
    authorizedTotal: moneyToCents(row.total_autorizado),
    updatedAt: row.atualizado_em,
    overdue: isOrderOverdue(status, row.previsao_conclusao_em, now),
  };
}

async function loadUserNames(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis_usuarios")
    .select("id, nome")
    .in("id", uniqueIds);
  if (error) throw new Error("Não foi possível carregar os responsáveis.");
  return new Map((data ?? []).map((user) => [user.id, user.nome]));
}

export async function listServiceOrders(
  input: Partial<OrderListFilters> & { page?: number } = {},
): Promise<ServiceOrderListResult> {
  await requirePermission("ordens:consultar");
  const filters = parseOrderListFilters(input);
  const pageSize = 10;
  const from = (filters.page - 1) * pageSize;
  const supabase = await createClient();
  let query = supabase
    .from("ordens_servico")
    .select(ORDER_LIST_FIELDS, { count: "exact" })
    .order("entrada_em", { ascending: false })
    .order("numero", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.status !== "todas") query = query.eq("situacao", filters.status);
  if (filters.responsibleId) {
    query = query.eq("responsavel_id", filters.responsibleId);
  }
  const range = buildOrderDateRange(filters.dateFrom, filters.dateTo);
  if (range.from) query = query.gte("entrada_em", range.from);
  if (range.until) query = query.lt("entrada_em", range.until);

  const term = sanitizeOrderSearch(filters.search);
  const orderNumber = parseOrderNumberSearch(term);
  if (orderNumber) {
    query = query.eq("numero", orderNumber);
  } else if (term) {
    const plate = term.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const expressions = [
      `cliente_nome.ilike.%${term}%`,
      `veiculo_marca.ilike.%${term}%`,
      `veiculo_modelo.ilike.%${term}%`,
    ];
    if (plate) expressions.push(`veiculo_placa.ilike.%${plate}%`);
    query = query.or(expressions.join(","));
  }

  const { data, error, count } = await query;
  if (error) throw new Error("Não foi possível carregar as ordens de serviço.");
  const rows = (data ?? []) as unknown as Array<
    Pick<
      OrderRow,
      | "id"
      | "numero"
      | "situacao"
      | "cliente_id"
      | "cliente_nome"
      | "veiculo_id"
      | "veiculo_placa"
      | "veiculo_marca"
      | "veiculo_modelo"
      | "responsavel_id"
      | "entrada_em"
      | "previsao_conclusao_em"
      | "total_autorizado"
      | "atualizado_em"
    >
  >;
  const names = await loadUserNames(rows.map((row) => row.responsavel_id));
  const total = count ?? 0;

  return {
    orders: rows.map((row) =>
      toSummary(row, userName(names, row.responsavel_id)),
    ),
    total,
    page: filters.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getServiceOrderById(
  id: string,
): Promise<ServiceOrderDetails | null> {
  await requirePermission("ordens:consultar");
  if (!orderIdSchema.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data: orderData, error: orderError } = await supabase
    .from("ordens_servico")
    .select(ORDER_DETAIL_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (orderError) throw new Error("Não foi possível carregar a ordem de serviço.");
  if (!orderData) return null;
  const order = orderData as unknown as OrderRow;

  const [diagnosesResult, itemsResult, approvalsResult, deliveryResult, historyResult] =
    await Promise.all([
      supabase
        .from("ordens_servico_diagnosticos")
        .select("id, descricao, observacoes, previsao_conclusao_em, usuario_id, criado_em")
        .eq("ordem_servico_id", id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("ordens_servico_itens")
        .select("id, tipo, servico_id, descricao, quantidade, valor_unitario, subtotal, situacao_aprovacao, executado_em, executado_por, ordem, removido_em, criado_por, criado_em, atualizado_em")
        .eq("ordem_servico_id", id)
        .order("ordem"),
      supabase
        .from("ordens_servico_aprovacoes")
        .select("id, item_id, decisao, canal, respondido_em, observacoes, usuario_id, criado_em")
        .eq("ordem_servico_id", id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("ordens_servico_entregas")
        .select("id, forma_pagamento, entregue_em, observacoes, usuario_id, criado_em, atualizado_em")
        .eq("ordem_servico_id", id)
        .maybeSingle(),
      supabase
        .from("ordens_servico_historico")
        .select("id, evento, situacao_anterior, situacao_posterior, resumo, justificativa, metadados, usuario_id, criado_em")
        .eq("ordem_servico_id", id)
        .order("criado_em", { ascending: false }),
    ]);

  if (
    diagnosesResult.error ||
    itemsResult.error ||
    approvalsResult.error ||
    deliveryResult.error ||
    historyResult.error
  ) {
    throw new Error("Não foi possível carregar os detalhes da ordem de serviço.");
  }

  const diagnoses = (diagnosesResult.data ?? []) as unknown as DiagnosisRow[];
  const items = (itemsResult.data ?? []) as unknown as ItemRow[];
  const approvals = (approvalsResult.data ?? []) as unknown as ApprovalRow[];
  const delivery = deliveryResult.data as unknown as DeliveryRow | null;
  const history = (historyResult.data ?? []) as unknown as HistoryRow[];
  const names = await loadUserNames([
    order.responsavel_id,
    order.criado_por,
    order.atualizado_por,
    ...diagnoses.map((row) => row.usuario_id),
    ...items.flatMap((row) =>
      [row.criado_por, row.executado_por, row.removido_por].filter(
        (userId): userId is string => Boolean(userId),
      ),
    ),
    ...approvals.map((row) => row.usuario_id),
    ...(delivery ? [delivery.usuario_id] : []),
    ...history.map((row) => row.usuario_id),
  ]);
  const summary = toSummary(
    order,
    userName(names, order.responsavel_id),
  );

  const mappedDiagnoses: OrderDiagnosis[] = diagnoses.map((row) => ({
    id: row.id,
    description: row.descricao,
    notes: row.observacoes,
    expectedCompletionAt: row.previsao_conclusao_em,
    authorId: row.usuario_id,
    authorName: userName(names, row.usuario_id),
    createdAt: row.criado_em,
  }));
  const mappedItems: ServiceOrderItem[] = items.map((row) => ({
    id: row.id,
    type: row.tipo as OrderItemType,
    serviceId: row.servico_id,
    description: row.descricao,
    quantity: row.quantidade,
    unitPrice: moneyToCents(row.valor_unitario),
    subtotal: moneyToCents(row.subtotal ?? 0),
    approvalStatus: row.situacao_aprovacao as ApprovalStatus,
    executedAt: row.executado_em,
    executedById: row.executado_por,
    executedByName: row.executado_por
      ? userName(names, row.executado_por)
      : null,
    order: row.ordem,
    removedAt: row.removido_em,
    createdById: row.criado_por,
    createdByName: userName(names, row.criado_por),
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }));
  const mappedApprovals: OrderApproval[] = approvals.map((row) => ({
    id: row.id,
    itemId: row.item_id,
    decision: row.decisao as OrderApproval["decision"],
    channel: row.canal as ApprovalChannel,
    respondedAt: row.respondido_em,
    notes: row.observacoes,
    authorId: row.usuario_id,
    authorName: userName(names, row.usuario_id),
    createdAt: row.criado_em,
  }));
  const mappedDelivery: OrderDelivery | null = delivery
    ? {
        id: delivery.id,
        paymentMethod: delivery.forma_pagamento as PaymentMethod,
        deliveredAt: delivery.entregue_em,
        notes: delivery.observacoes,
        authorId: delivery.usuario_id,
        authorName: userName(names, delivery.usuario_id),
        createdAt: delivery.criado_em,
        updatedAt: delivery.atualizado_em,
      }
    : null;
  const mappedHistory: OrderHistoryEvent[] = history.map((row) => ({
    id: row.id,
    event: row.evento,
    previousStatus: row.situacao_anterior as OrderStatus | null,
    nextStatus: row.situacao_posterior as OrderStatus | null,
    summary: row.resumo,
    justification: row.justificativa,
    metadata: row.metadados,
    authorId: row.usuario_id,
    authorName: userName(names, row.usuario_id),
    createdAt: row.criado_em,
  }));

  return {
    ...summary,
    clientCpf: order.cliente_cpf,
    clientPhone: order.cliente_telefone,
    vehicleBrand: order.veiculo_marca,
    vehicleModel: order.veiculo_modelo,
    vehicleManufactureYear: order.veiculo_ano_fabricacao,
    vehicleModelYear: order.veiculo_ano_modelo,
    mileage: order.quilometragem,
    fuelLevel: order.nivel_combustivel as FuelLevel,
    customerComplaint: order.relato_cliente,
    accessories: order.acessorios,
    visibleDamage: order.avarias_visiveis,
    intakeNotes: order.observacoes_entrada,
    servicesSubtotal: moneyToCents(order.subtotal_servicos),
    materialsSubtotal: moneyToCents(order.subtotal_materiais),
    quotedSubtotal: moneyToCents(order.subtotal_orcado),
    approvedSubtotal: moneyToCents(order.subtotal_autorizado),
    discount: moneyToCents(order.desconto),
    quotedTotal: moneyToCents(order.total_orcado),
    finalTotal: moneyToCents(order.total_final),
    version: order.versao,
    createdById: order.criado_por,
    createdByName: userName(names, order.criado_por),
    updatedById: order.atualizado_por,
    updatedByName: userName(names, order.atualizado_por),
    createdAt: order.criado_em,
    diagnoses: mappedDiagnoses,
    items: mappedItems,
    approvals: mappedApprovals,
    delivery: mappedDelivery,
    history: mappedHistory,
  };
}

export async function listActiveOrderClients(): Promise<OrderClientOption[]> {
  await requirePermission("ordens:atender");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, cpf")
    .eq("ativo", true)
    .order("nome")
    .limit(500);
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return (data ?? []).map((row) => ({ id: row.id, name: row.nome, cpf: row.cpf }));
}

export async function listActiveOrderVehicles(
  clientId: string,
): Promise<OrderVehicleOption[]> {
  await requirePermission("ordens:atender");
  if (!orderIdSchema.safeParse(clientId).success) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("id, cliente_id, placa, marca, modelo, ano_modelo")
    .eq("cliente_id", clientId)
    .eq("ativo", true)
    .order("marca")
    .order("modelo")
    .limit(100);
  if (error) throw new Error("Não foi possível carregar os veículos.");
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.cliente_id,
    plate: row.placa,
    label: `${row.marca} ${row.modelo} (${row.ano_modelo})`,
  }));
}

export async function listActiveOrderServices(): Promise<OrderServiceOption[]> {
  await requirePermission("ordens:atender");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .select("id, nome, categoria, valor_base")
    .eq("ativo", true)
    .order("nome")
    .limit(500);
  if (error) throw new Error("Não foi possível carregar os serviços.");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.nome,
    category: row.categoria,
    basePrice: row.valor_base,
  }));
}

export async function listActiveOrderResponsibles(): Promise<
  OrderResponsibleOption[]
> {
  await requirePermission("ordens:atender");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis_usuarios")
    .select("id, nome, perfil")
    .eq("ativo", true)
    .order("nome")
    .limit(100);
  if (error) throw new Error("Não foi possível carregar os responsáveis.");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.nome,
    role: row.perfil,
  }));
}
