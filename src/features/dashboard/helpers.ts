import { buildOrderDateRange } from "@/features/ordens-servico/query-helpers";
import type { DashboardAttentionItem, DashboardNextAction, DashboardOrder } from "./types";

export const DASHBOARD_ACTIVE_STATUSES = [
  "aberta",
  "em_diagnostico",
  "aguardando_aprovacao",
  "aprovada",
  "em_execucao",
  "pronta_retirada",
] as const;

function saoPauloDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getDashboardDayRange(now = new Date()) {
  return buildOrderDateRange(saoPauloDate(now), saoPauloDate(now));
}

export function buildDashboardStatusCounts(orders: DashboardOrder[]) {
  return {
    diagnosis: orders.filter((order) => order.status === "em_diagnostico").length,
    awaitingApproval: orders.filter((order) => order.status === "aguardando_aprovacao").length,
    execution: orders.filter((order) => order.status === "em_execucao").length,
    readyForPickup: orders.filter((order) => order.status === "pronta_retirada").length,
    overdue: orders.filter((order) => order.overdue).length,
  };
}

function attentionPriority(order: DashboardOrder) {
  if (order.overdue) return 0;
  if (order.status === "pronta_retirada") return 1;
  if (order.status === "aguardando_aprovacao") return 2;
  return 3;
}

export function isDashboardAttentionOrder(order: DashboardOrder) {
  return (
    order.overdue ||
    order.status === "pronta_retirada" ||
    order.status === "aguardando_aprovacao"
  );
}

export function buildDashboardAttentionItems(
  orders: DashboardOrder[],
  limit = 4,
): DashboardAttentionItem[] {
  return orders
    .filter(isDashboardAttentionOrder)
    .sort(
      (first, second) =>
        attentionPriority(first) - attentionPriority(second) ||
        (first.expectedCompletionAt ?? first.entryAt).localeCompare(
          second.expectedCompletionAt ?? second.entryAt,
        ),
    )
    .slice(0, limit)
    .map((order) => {
      if (order.overdue) {
        return {
          id: order.id,
          title: `OS #${String(order.number).padStart(4, "0")} está atrasada`,
          detail: `${order.vehicleLabel} · ${order.clientName}`,
          action: "Revisar ordem",
          href: `/ordens-servico/${order.id}`,
          overdue: true,
        };
      }
      if (order.status === "pronta_retirada") {
        return {
          id: order.id,
          title: `OS #${String(order.number).padStart(4, "0")} está pronta`,
          detail: `${order.vehicleLabel} aguarda retirada`,
          action: "Registrar entrega",
          href: `/ordens-servico/${order.id}`,
          overdue: false,
        };
      }
      return {
        id: order.id,
        title: `OS #${String(order.number).padStart(4, "0")} aguarda aprovação`,
        detail: `${order.vehicleLabel} · ${order.clientName}`,
        action: "Registrar resposta",
        href: `/ordens-servico/${order.id}`,
        overdue: false,
      };
    });
}

export function buildDashboardNextActions(
  orders: DashboardOrder[],
  limit = 4,
): DashboardNextAction[] {
  const priority = new Map([
    ["pronta_retirada", 0],
    ["aguardando_aprovacao", 1],
    ["aberta", 2],
    ["em_diagnostico", 3],
    ["aprovada", 4],
    ["em_execucao", 5],
  ]);
  return orders
    .filter((order) => priority.has(order.status))
    .sort(
      (first, second) =>
        (first.overdue ? -1 : priority.get(first.status) ?? 9) -
          (second.overdue ? -1 : priority.get(second.status) ?? 9) ||
        first.entryAt.localeCompare(second.entryAt),
    )
    .slice(0, limit)
    .map((order) => {
      const number = `OS #${String(order.number).padStart(4, "0")}`;
      if (order.overdue) {
        return { id: order.id, title: `Revisar prazo da ${number}`, detail: order.vehicleLabel, href: `/ordens-servico/${order.id}`, kind: "overdue" };
      }
      if (order.status === "pronta_retirada") {
        return { id: order.id, title: `Entregar ${number}`, detail: `${order.vehicleLabel} · ${order.clientName}`, href: `/ordens-servico/${order.id}`, kind: "delivery" };
      }
      if (order.status === "aguardando_aprovacao") {
        return { id: order.id, title: `Registrar aprovação da ${number}`, detail: order.clientName, href: `/ordens-servico/${order.id}`, kind: "approval" };
      }
      if (order.status === "aberta") {
        return { id: order.id, title: `Iniciar diagnóstico da ${number}`, detail: order.vehicleLabel, href: `/ordens-servico/${order.id}`, kind: "diagnosis" };
      }
      if (order.status === "em_diagnostico") {
        return { id: order.id, title: `Continuar diagnóstico da ${number}`, detail: order.vehicleLabel, href: `/ordens-servico/${order.id}`, kind: "diagnosis" };
      }
      if (order.status === "aprovada") {
        return { id: order.id, title: `Iniciar execução da ${number}`, detail: order.vehicleLabel, href: `/ordens-servico/${order.id}`, kind: "execution" };
      }
      return { id: order.id, title: `Atualizar execução da ${number}`, detail: order.vehicleLabel, href: `/ordens-servico/${order.id}`, kind: "execution" };
    });
}
