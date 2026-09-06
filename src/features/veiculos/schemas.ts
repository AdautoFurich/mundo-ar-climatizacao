import { z } from "zod";

export const FUEL_VALUES = [
  "gasolina",
  "etanol",
  "flex",
  "diesel",
  "eletrico",
  "hibrido",
] as const;

const maximumVehicleYear = new Date().getFullYear() + 1;

export function normalizePlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function normalizeVehicleText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

const requiredText = (message: string, maximum: number) =>
  z
    .string()
    .transform(normalizeVehicleText)
    .pipe(
      z
        .string()
        .min(1, message)
        .max(maximum, `Use no máximo ${maximum} caracteres.`),
    );

const optionalText = (maximum: number) =>
  z
    .string()
    .transform(normalizeVehicleText)
    .pipe(z.string().max(maximum, `Use no máximo ${maximum} caracteres.`))
    .transform((value) => value || null);

const vehicleYear = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}$/, `Informe o ${label} com 4 dígitos.`)
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1900, `O ${label} deve ser a partir de 1900.`)
        .max(
          maximumVehicleYear,
          `O ${label} deve ser no máximo ${maximumVehicleYear}.`,
        ),
    );

const vehicleFieldsSchema = z.object({
  ownerId: z.string().uuid("Selecione um proprietário válido."),
  plate: z
    .string()
    .transform(normalizePlate)
    .refine(
      (value) => /^[A-Z]{3}(?:[0-9]{4}|[0-9][A-Z][0-9]{2})$/.test(value),
      "Informe uma placa brasileira válida.",
    ),
  brand: requiredText("Informe a marca.", 60),
  model: requiredText("Informe o modelo.", 80),
  manufactureYear: vehicleYear("ano de fabricação"),
  modelYear: vehicleYear("ano do modelo"),
  color: optionalText(40),
  fuel: z
    .enum([...FUEL_VALUES, ""], {
      error: "Selecione um combustível válido.",
    })
    .transform((value) => value || null),
  notes: optionalText(1000),
});

function validateModelYear(
  data: { manufactureYear: number; modelYear: number },
  context: z.RefinementCtx,
) {
  if (
    data.modelYear < data.manufactureYear ||
    data.modelYear > data.manufactureYear + 1
  ) {
    context.addIssue({
      code: "custom",
      path: ["modelYear"],
      message:
        "O ano do modelo deve ser igual ou um ano posterior ao de fabricação.",
    });
  }
}

export const vehicleFormSchema = vehicleFieldsSchema.superRefine(validateModelYear);

export const vehicleEditFormSchema = vehicleFieldsSchema
  .omit({ ownerId: true })
  .superRefine(validateModelYear);

export const vehicleIdSchema = z.string().uuid("Veículo inválido.");

export const transferVehicleSchema = z.object({
  vehicleId: vehicleIdSchema,
  newOwnerId: z.string().uuid("Selecione um novo proprietário válido."),
});

export type VehicleFormInput = z.input<typeof vehicleFormSchema>;
export type VehicleFormData = z.output<typeof vehicleFormSchema>;
export type VehicleEditFormInput = z.input<typeof vehicleEditFormSchema>;
export type VehicleEditFormData = z.output<typeof vehicleEditFormSchema>;
