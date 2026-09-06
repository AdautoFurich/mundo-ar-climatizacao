import type { ServiceCategory } from "@/features/servicos/schemas";

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

export type FuelLevel =
  | "reserva"
  | "um_quarto"
  | "metade"
  | "tres_quartos"
  | "cheio";

export type ApprovalChannel = "whatsapp" | "telefone" | "presencial";

export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "transferencia"
  | "outro";

export type ServiceOrderSummary = {
  id: string;
  number: number;
  status: OrderStatus;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleLabel: string;
  responsibleId: string;
  responsibleName: string;
  entryAt: string;
  expectedCompletionAt: string | null;
  authorizedTotal: number;
  updatedAt: string;
  overdue: boolean;
};

export type ServiceOrderListResult = {
  orders: ServiceOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type OrderDiagnosis = {
  id: string;
  description: string;
  notes: string | null;
  expectedCompletionAt: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type OrderApproval = {
  id: string;
  itemId: string;
  decision: Exclude<ApprovalStatus, "pendente">;
  channel: ApprovalChannel;
  respondedAt: string;
  notes: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type ServiceOrderItem = {
  id: string;
  type: OrderItemType;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  approvalStatus: ApprovalStatus;
  executedAt: string | null;
  executedById: string | null;
  executedByName: string | null;
  order: number;
  removedAt: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderDelivery = {
  id: string;
  paymentMethod: PaymentMethod;
  deliveredAt: string;
  notes: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderHistoryEvent = {
  id: string;
  event: string;
  previousStatus: OrderStatus | null;
  nextStatus: OrderStatus | null;
  summary: string;
  justification: string | null;
  metadata: unknown;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type ServiceOrderDetails = ServiceOrderSummary & {
  clientCpf: string;
  clientPhone: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleManufactureYear: number;
  vehicleModelYear: number;
  mileage: number;
  fuelLevel: FuelLevel;
  customerComplaint: string;
  accessories: string | null;
  visibleDamage: string | null;
  intakeNotes: string | null;
  servicesSubtotal: number;
  materialsSubtotal: number;
  quotedSubtotal: number;
  approvedSubtotal: number;
  discount: number;
  quotedTotal: number;
  finalTotal: number;
  version: number;
  createdById: string;
  createdByName: string;
  updatedById: string;
  updatedByName: string;
  createdAt: string;
  diagnoses: OrderDiagnosis[];
  items: ServiceOrderItem[];
  approvals: OrderApproval[];
  delivery: OrderDelivery | null;
  history: OrderHistoryEvent[];
};

export type OrderClientOption = {
  id: string;
  name: string;
  cpf: string;
};

export type OrderVehicleOption = {
  id: string;
  clientId: string;
  plate: string;
  label: string;
};

export type OrderServiceOption = {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number | null;
};

export type OrderResponsibleOption = {
  id: string;
  name: string;
  role: "administrador" | "atendente";
};
