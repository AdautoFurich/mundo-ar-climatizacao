import { describe, expect, it } from "vitest";

import { can } from "./permissions";

describe("matriz de permissões", () => {
  it("permite que o administrador gerencie usuários", () => {
    expect(can("administrador", "usuarios:gerenciar")).toBe(true);
  });

  it("impede que o atendente gerencie usuários", () => {
    expect(can("atendente", "usuarios:gerenciar")).toBe(false);
  });

  it("permite que os dois perfis acessem o sistema", () => {
    expect(can("administrador", "sistema:acessar")).toBe(true);
    expect(can("atendente", "sistema:acessar")).toBe(true);
  });

  it("permite que o atendente conduza e execute ordens de serviço", () => {
    expect(can("atendente", "ordens:atender")).toBe(true);
    expect(can("atendente", "ordens:executar")).toBe(true);
  });
});
