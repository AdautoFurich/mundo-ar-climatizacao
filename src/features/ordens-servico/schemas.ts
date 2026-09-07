import { z } from "zod";

import {
  APPROVAL_STATUS_VALUES,
  ORDER_ITEM_TYPE_VALUES,
  ORDER_STATUS_VALUES,
  type OrderItemType,
} from "./types";

export const FUEL_LEVEL_VALUES = [
  "reserva",
  "um_quarto",
  "metade",
  "tres_quartos",
  "cheio",
] as const;

export const APPROVAL_CHANNEL_VALUES = [
  "whatsapp",
  "telefone",
  "presencial",
] as const;

export const PAYMENT_METHOD_VALUES = [
  "dinheiro",
  "pix",
  "cartao_credito",
  "cartao_debito",
  "transferencia",
  "outro",
] as const;

const MAXIMUM_MONEY_CENTS = 999_999_999_999;
const MAXIMUM_QUANTITY_THOUSANDTHS = 999_999_999;
const BRAZILIAN_CURRENCY_PATTERN =
  /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;
const QUANTITY_PATTERN = /^\d+(?:,\d{1,3})?$/;
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

export function normalizeOrderText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function requiredText(message: string, maximum: number) {
  return z
    .string()
    .transform(normalizeOrderText)
    .pipe(
      z
        .string()
        .min(1, message)
        .max(maximum, `Use no máximo ${maximum} caracteres.`),
    );
}

function optionalText(maximum: number) {
  return z
    .string()
    .transform(normalizeOrderText)
    .pipe(z.string().max(maximum, `Use no máximo ${maximum} caracteres.`))
    .transform((value) => value || null);
}

function parseIsoDateTime(value: string) {
  if (!ISO_DATE_TIME.test(value)) {
    throw new Error("Informe uma data e hora válidas.");
  }
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const date = new Date(hasTimeZone ? value : `${value}-03:00`);
  const [calendarDate] = value.split("T");
  const [year, month, day] = calendarDate.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    Number.isNaN(date.getTime()) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth
  ) {
    throw new Error("Informe uma data e hora válidas.");
  }
  return date.toISOString();
}

function dateTimeSchema(message: string) {
  return z.string().trim().transform((value, context) => {
    try {
      return parseIsoDateTime(value);
    } catch {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    }
  });
}

function optionalDateTimeSchema() {
  return z.string().trim().transform((value, context) => {
    if (!value) return null;
    try {
      return parseIsoDateTime(value);
    } catch {
      context.addIssue({ code: "custom", message: "Informe uma previsão válida." });
      return z.NEVER;
    }
  });
}

export function parseBrazilianCurrencyToCents(value: string) {
  const trimmed = value.trim();
  if (!BRAZILIAN_CURRENCY_PATTERN.test(trimmed)) {
    throw new Error("Informe um valor monetário válido.");
  }

  const normalized = trimmed.replace(/\./g, "");
  const [integerPart, decimalPart = ""] = normalized.split(",");
  const cents = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAXIMUM_MONEY_CENTS) {
    throw new Error("O valor está acima do limite permitido.");
  }
  return cents;
}

export function parseQuantityToThousandths(value: string) {
  const trimmed = value.trim();
  if (!QUANTITY_PATTERN.test(trimmed)) {
    throw new Error("Informe uma quantidade válida.");
  }

  const [integerPart, decimalPart = ""] = trimmed.split(",");
  const thousandths =
    Number(integerPart) * 1000 + Number(decimalPart.padEnd(3, "0"));
  if (
    !Number.isSafeInteger(thousandths) ||
    thousandths <= 0 ||
    thousandths > MAXIMUM_QUANTITY_THOUSANDTHS
  ) {
    throw new Error("A quantidade está fora do limite permitido.");
  }
  return thousandths;
}

const moneySchema = z.string().trim().transform((value, context) => {
  try {
    return parseBrazilianCurrencyToCents(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Informe um valor válido.",
    });
    return z.NEVER;
  }
});

const quantitySchema = z.string().trim().transform((value, context) => {
  try {
    return parseQuantityToThousandths(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message:
        error instanceof Error ? error.message : "Informe uma quantidade válida.",
    });
    return z.NEVER;
  }
});

export const orderIdSchema = z.string().uuid("Ordem de serviço inválida.");

export const intakeSchema = z
  .object({
    clientId: z.string().uuid("Selecione um cliente válido."),
    vehicleId: z.string().uuid("Selecione um veículo válido."),
    responsibleId: z.string().uuid("Selecione um responsável válido."),
    entryAt: dateTimeSchema("Informe a data e a hora de entrada."),
    mileage: z
      .string()
      .trim()
      .regex(/^\d+$/, "Informe a quilometragem sem casas decimais.")
      .transform(Number)
      .pipe(z.number().int().min(0).max(9_999_999)),
    fuelLevel: z.enum(FUEL_LEVEL_VALUES, {
      error: "Selecione o nível de combustível.",
    }),
    customerComplaint: requiredText("Informe o relato do cliente.", 2000),
    expectedCompletionAt: optionalDateTimeSchema(),
    accessories: optionalText(1000),
    visibleDamage: optionalText(1000),
    notes: optionalText(1000),
  })
  .superRefine((data, context) => {
    if (
      data.expectedCompletionAt &&
      new Date(data.expectedCompletionAt) <= new Date(data.entryAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["expectedCompletionAt"],
        message: "A previsão deve ser posterior à entrada.",
      });
    }
  });

export const diagnosisSchema = z.object({
  description: requiredText("Informe o diagnóstico técnico.", 5000),
  notes: optionalText(2000),
  expectedCompletionAt: optionalDateTimeSchema(),
  expectedVersion: z
    .string()
    .trim()
    .regex(/^\d+$/, "Versão da ordem inválida.")
    .transform(Number)
    .pipe(z.number().int().positive()),
});

export const orderItemSchema = z
  .object({
    type: z.enum(ORDER_ITEM_TYPE_VALUES),
    serviceId: z
      .union([z.string().uuid("Selecione um serviço válido."), z.literal("")])
      .transform((value) => value || null),
    description: requiredText("Informe a descrição do item.", 200),
    quantity: quantitySchema,
    unitPrice: moneySchema,
  })
  .superRefine((data, context) => {
    if (data.type === "servico" && !data.serviceId) {
      context.addIssue({
        code: "custom",
        path: ["serviceId"],
        message: "Selecione o serviço do catálogo.",
      });
    }
    if (data.type === "material" && data.serviceId) {
      context.addIssue({
        code: "custom",
        path: ["serviceId"],
        message: "Peças e materiais não usam um serviço do catálogo.",
      });
    }
  })
  .transform((data) => ({
    type: data.type as OrderItemType,
    serviceId: data.serviceId,
    description: data.description,
    quantityThousandths: data.quantity,
    unitPriceCents: data.unitPrice,
  }));

export const approvalSchema = z.object({
  itemId: z.string().uuid("Item inválido."),
  decision: z.enum(APPROVAL_STATUS_VALUES).refine(
    (value) => value !== "pendente",
    "Registre a aprovação ou a recusa.",
  ),
  channel: z.enum(APPROVAL_CHANNEL_VALUES),
  respondedAt: dateTimeSchema("Informe a data e a hora da resposta."),
  notes: optionalText(1000),
  expectedVersion: z.coerce.number().int().positive(),
});

export const discountSchema = z.object({
  discount: moneySchema,
  expectedVersion: z.coerce.number().int().positive(),
});

export const deliverySchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  deliveredAt: dateTimeSchema("Informe a data e a hora da entrega."),
  notes: optionalText(2000),
  expectedVersion: z.coerce.number().int().positive(),
});

export const justifiedTransitionSchema = z.object({
  targetStatus: z.enum(ORDER_STATUS_VALUES),
  justification: requiredText("Informe a justificativa.", 1000),
  expectedVersion: z.coerce.number().int().positive(),
});

export type IntakeInput = z.input<typeof intakeSchema>;
export type IntakeData = z.output<typeof intakeSchema>;
export type OrderItemData = z.output<typeof orderItemSchema>;
export type DiagnosisData = z.output<typeof diagnosisSchema>;
export type DiagnosisInput = z.input<typeof diagnosisSchema>;
export type ApprovalData = z.output<typeof approvalSchema>;
export type DeliveryData = z.output<typeof deliverySchema>;
