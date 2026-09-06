import type { OrderStatus } from "./types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  aberta: "Aberta",
  em_diagnostico: "Em diagnóstico",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovada: "Aprovada",
  em_execucao: "Em execução",
  pronta_retirada: "Pronta para retirada",
  entregue: "Entregue",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
};

export function formatOrderNumber(number: number) {
  if (!Number.isSafeInteger(number) || number <= 0) return "OS inválida";
  return `OS #${String(number).padStart(4, "0")}`;
}

export function formatOrderStatus(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status];
}

export function formatOrderMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatMileage(mileage: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(mileage)} km`;
}

export function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
