import { z } from "zod";

export const SERVICE_CATEGORY_VALUES = [
  "climatizacao",
  "eletrica_automotiva",
  "diagnostico",
  "manutencao_preventiva",
  "outros",
] as const;

const MAXIMUM_BASE_PRICE_CENTS = BigInt("999999999999");
const BRAZILIAN_CURRENCY_PATTERN =
  /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;

export function normalizeServiceText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function requiredText(message: string, maximum: number) {
  return z
    .string()
    .transform(normalizeServiceText)
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
    .transform(normalizeServiceText)
    .pipe(z.string().max(maximum, `Use no máximo ${maximum} caracteres.`))
    .transform((value) => value || null);
}

const basePriceSchema = z.string().trim().transform((value, context) => {
  if (!value) return null;

  if (!BRAZILIAN_CURRENCY_PATTERN.test(value)) {
    context.addIssue({
      code: "custom",
      message: "Informe um valor válido, usando vírgula para os centavos.",
    });
    return z.NEVER;
  }

  const normalized = value.replace(/\./g, "");
  const [integerPart, decimalPart = ""] = normalized.split(",");
  const integer = BigInt(integerPart);
  const decimals = decimalPart.padEnd(2, "0");
  const cents = integer * BigInt(100) + BigInt(decimals);

  if (cents > MAXIMUM_BASE_PRICE_CENTS) {
    context.addIssue({
      code: "custom",
      message: "O valor-base está acima do limite permitido.",
    });
    return z.NEVER;
  }

  return `${integer}.${decimals}`;
});

export const serviceFormSchema = z.object({
  name: requiredText("Informe o nome do serviço.", 100),
  category: z
    .enum([...SERVICE_CATEGORY_VALUES, ""], {
      error: "Selecione uma categoria válida.",
    })
    .refine((value) => value !== "", "Selecione uma categoria válida.")
    .transform((value) => value as ServiceCategory),
  description: optionalText(1000),
  basePrice: basePriceSchema,
});

export const serviceIdSchema = z.string().uuid("Serviço inválido.");

export type ServiceCategory = (typeof SERVICE_CATEGORY_VALUES)[number];
export type ServiceFormInput = z.input<typeof serviceFormSchema>;
export type ServiceFormData = z.output<typeof serviceFormSchema>;
