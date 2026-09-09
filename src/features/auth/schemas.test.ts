import { describe, expect, it } from "vitest";

import {
  inviteUserSchema,
  loginSchema,
  updatePasswordSchema,
} from "./schemas";

describe("schemas de autenticação", () => {
  it("normaliza o e-mail no login", () => {
    const result = loginSchema.parse({
      email: "  ADMIN@MUNDOAR.COM.BR ",
      password: "segredo",
    });

    expect(result.email).toBe("admin@mundoar.com.br");
  });

  it("recusa senha vazia no login", () => {
    expect(
      loginSchema.safeParse({ email: "admin@mundoar.com.br", password: "" })
        .success,
    ).toBe(false);
  });

  it("exige confirmação e complexidade na nova senha", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "NovaSenha1!",
        confirmPassword: "outra",
      }).success,
    ).toBe(false);

    expect(
      updatePasswordSchema.safeParse({
        password: "NovaSenha1!",
        confirmPassword: "NovaSenha1!",
      }).success,
    ).toBe(true);
  });

  it("aceita somente os dois perfis previstos no convite", () => {
    expect(
      inviteUserSchema.safeParse({
        name: "Maria Souza",
        email: "maria@mundoar.com.br",
        role: "atendente",
      }).success,
    ).toBe(true);

    expect(
      inviteUserSchema.safeParse({
        name: "Maria Souza",
        email: "maria@mundoar.com.br",
        role: "tecnico",
      }).success,
    ).toBe(false);

    expect(
      inviteUserSchema.safeParse({
        name: "Maria Souza",
        email: "maria@mundoar.com.br",
        role: "superusuario",
      }).success,
    ).toBe(false);
  });
});
