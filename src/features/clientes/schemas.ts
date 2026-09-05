import { z } from "zod";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split("")
      .reduce(
        (total, digit, index) =>
          total + Number(digit) * (length + 1 - index),
        0,
      );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(9) === Number(cpf[9]) &&
    calculateDigit(10) === Number(cpf[10])
  );
}

const requiredText = (message: string, maximum: number) =>
  z
    .string()
    .transform(normalizeSpaces)
    .pipe(
      z
        .string()
        .min(1, message)
        .max(maximum, `Use no máximo ${maximum} caracteres.`),
    );

const optionalText = (maximum: number) =>
  z
    .string()
    .transform(normalizeSpaces)
    .pipe(z.string().max(maximum, `Use no máximo ${maximum} caracteres.`))
    .transform((value) => value || null);

const digitsWithLength = (message: string, lengths: readonly number[]) =>
  z
    .string()
    .transform(onlyDigits)
    .refine((value) => lengths.includes(value.length), message);

export const clientFormSchema = z.object({
  name: requiredText("Informe o nome completo.", 120),
  cpf: digitsWithLength("Informe um CPF com 11 dígitos.", [11]).refine(
    isValidCpf,
    "Informe um CPF válido.",
  ),
  primaryPhone: digitsWithLength(
    "Informe um telefone com DDD, usando 10 ou 11 dígitos.",
    [10, 11],
  ),
  alternatePhone: z
    .string()
    .transform(onlyDigits)
    .refine(
      (value) =>
        value.length === 0 || value.length === 10 || value.length === 11,
      "Informe um telefone alternativo com 10 ou 11 dígitos.",
    )
    .transform((value) => value || null),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Use no máximo 254 caracteres.")
    .refine(
      (value) => value.length === 0 || z.string().email().safeParse(value).success,
      "Informe um e-mail válido.",
    )
    .transform((value) => value || null),
  zipCode: digitsWithLength("Informe um CEP com 8 dígitos.", [8]),
  street: requiredText("Informe o logradouro.", 160),
  number: requiredText("Informe o número.", 20),
  complement: optionalText(80),
  neighborhood: requiredText("Informe o bairro.", 100),
  city: requiredText("Informe a cidade.", 100),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => /^[A-Z]{2}$/.test(value), "Informe a UF com 2 letras."),
  notes: optionalText(1000),
});

export const clientIdSchema = z.string().uuid("Cliente inválido.");

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormData = z.output<typeof clientFormSchema>;
