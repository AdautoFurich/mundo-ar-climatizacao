import type { ServiceCategory } from "./schemas";

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  climatizacao: "Climatização",
  eletrica_automotiva: "Elétrica automotiva",
  diagnostico: "Diagnóstico",
  manutencao_preventiva: "Manutenção preventiva",
  outros: "Outros",
};

export function formatServiceCategory(category: ServiceCategory) {
  return SERVICE_CATEGORY_LABELS[category];
}

export function formatBasePrice(value: string | number | null) {
  if (value === null) return "A definir";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatBasePriceInput(value: string | number | null) {
  if (value === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatServiceDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
