export const ORDER_STATUS_VALUES = [
  "aberta",
  "em_diagnostico",
  "aguardando_aprovacao",
  "aprovada",
  "em_execucao",
  "pronta_retirada",
  "entregue",
  "reprovada",
  "cancelada",
] as const;

export const ORDER_ITEM_TYPE_VALUES = ["servico", "material"] as const;

export const APPROVAL_STATUS_VALUES = [
  "pendente",
  "aprovado",
  "recusado",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];
export type OrderItemType = (typeof ORDER_ITEM_TYPE_VALUES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];

export type CalculableOrderItem = {
  type: OrderItemType;
  quantityThousandths: number;
  unitPriceCents: number;
  approvalStatus: ApprovalStatus;
  removed?: boolean;
};

export type OrderTotals = {
  servicesSubtotalCents: number;
  materialsSubtotalCents: number;
  quotedSubtotalCents: number;
  approvedSubtotalCents: number;
  discountCents: number;
  quotedTotalCents: number;
  approvedTotalCents: number;
};

export type OrderTransitionKind =
  | "normal"
  | "retrocesso_administrativo"
  | "reabertura_administrativa"
  | "invalida";
