import type {
  ApprovalChannel,
  ApprovalStatus,
  FuelLevel,
  OrderStatus,
  PaymentMethod,
} from "./types";

export const APPROVAL_CHANNEL_LABELS: Record<ApprovalChannel, string> = {
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  presencial: "Presencial",
};

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

export const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  reserva: "Reserva",
  um_quarto: "1/4",
  metade: "1/2",
  tres_quartos: "3/4",
  cheio: "Cheio",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  outro: "Outro",
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

export function formatOrderDateTimeInput(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

export function formatFuelLevel(level: FuelLevel) {
  return FUEL_LEVEL_LABELS[level];
}

export function formatApprovalStatus(status: ApprovalStatus) {
  return APPROVAL_STATUS_LABELS[status];
}

export function formatApprovalChannel(channel: ApprovalChannel) {
  return APPROVAL_CHANNEL_LABELS[channel];
}

export function formatPaymentMethod(method: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[method];
}

export function formatOrderQuantity(quantity: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(quantity);
}
