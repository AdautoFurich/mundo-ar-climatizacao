import { z } from "zod";

import { USER_ROLES } from "./types";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail válido.");

const strongPasswordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra.")
  .regex(/[0-9]/, "Inclua pelo menos um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua pelo menos um caractere especial.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

export const recoverySchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export const inviteUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do funcionário.")
    .max(120, "Use no máximo 120 caracteres."),
  email: emailSchema,
  role: z.enum(USER_ROLES, { error: "Selecione um perfil válido." }),
});

export const updateUserSchema = z.object({
  userId: z.string().uuid("Usuário inválido."),
  name: z.string().trim().min(2).max(120),
  role: z.enum(USER_ROLES),
  active: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
