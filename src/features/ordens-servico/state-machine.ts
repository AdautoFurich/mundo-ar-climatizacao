import type {
  OrderStatus,
  OrderTransitionKind,
} from "./types";

const NORMAL_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  aberta: ["em_diagnostico", "cancelada"],
  em_diagnostico: ["aguardando_aprovacao", "cancelada"],
  aguardando_aprovacao: ["aprovada", "reprovada", "cancelada"],
  aprovada: ["em_execucao", "cancelada"],
  em_execucao: ["pronta_retirada", "cancelada"],
  pronta_retirada: ["entregue", "cancelada"],
  entregue: [],
  reprovada: [],
  cancelada: [],
};

const ACTIVE_FLOW: readonly OrderStatus[] = [
  "aberta",
  "em_diagnostico",
  "aguardando_aprovacao",
  "aprovada",
  "em_execucao",
  "pronta_retirada",
];

const REOPEN_TARGET: Partial<Record<OrderStatus, OrderStatus>> = {
  entregue: "pronta_retirada",
  reprovada: "aguardando_aprovacao",
};

export function getNextNormalStatuses(status: OrderStatus) {
  return [...NORMAL_TRANSITIONS[status]];
}

export function classifyOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): OrderTransitionKind {
  if (NORMAL_TRANSITIONS[from].includes(to)) return "normal";

  const fromIndex = ACTIVE_FLOW.indexOf(from);
  const toIndex = ACTIVE_FLOW.indexOf(to);
  if (fromIndex >= 0 && toIndex >= 0 && toIndex < fromIndex) {
    return "retrocesso_administrativo";
  }

  if (REOPEN_TARGET[from] === to) return "reabertura_administrativa";
  if (from === "cancelada" && toIndex >= 0) {
    return "reabertura_administrativa";
  }

  return "invalida";
}
