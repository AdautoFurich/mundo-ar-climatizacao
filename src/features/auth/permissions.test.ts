import { describe, expect, it } from "vitest";

import { can } from "./permissions";

describe("matriz de permissões", () => {
  it("permite que o administrador gerencie usuários", () => {
    expect(can("administrador", "usuarios:gerenciar")).toBe(true);
  });

  it("impede que atendente e técnico gerenciem usuários", () => {
    expect(can("atendente", "usuarios:gerenciar")).toBe(false);
    expect(can("tecnico", "usuarios:gerenciar")).toBe(false);
  });

  it("permite que os três perfis acessem o sistema", () => {
    expect(can("administrador", "sistema:acessar")).toBe(true);
    expect(can("atendente", "sistema:acessar")).toBe(true);
    expect(can("tecnico", "sistema:acessar")).toBe(true);
  });
});
