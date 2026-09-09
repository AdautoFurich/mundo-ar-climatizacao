import { describe, expect, it } from "vitest";

import { clientFormSchema, isValidCpf } from "./schemas";

const validClient = {
  name: "  Maria   da Silva  ",
  cpf: "529.982.247-25",
  primaryPhone: "(44) 99912-3456",
  alternatePhone: "",
  email: "  MARIA@EXEMPLO.COM.BR ",
  zipCode: "87.010-000",
  street: "  Avenida Brasil ",
  number: "  100-A ",
  complement: "  Sala 2 ",
  neighborhood: "  Centro ",
  city: "  Maringá ",
  state: " pr ",
  notes: "  Cliente prefere contato pela manhã. ",
};

describe("validação de clientes", () => {
  it("valida os dígitos verificadores do CPF", () => {
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
  });

  it("normaliza os dados antes da gravação", () => {
    expect(clientFormSchema.parse(validClient)).toEqual({
      name: "Maria da Silva",
      cpf: "52998224725",
      primaryPhone: "44999123456",
      alternatePhone: null,
      email: "maria@exemplo.com.br",
      zipCode: "87010000",
      street: "Avenida Brasil",
      number: "100-A",
      complement: "Sala 2",
      neighborhood: "Centro",
      city: "Maringá",
      state: "PR",
      notes: "Cliente prefere contato pela manhã.",
    });
  });

  it("rejeita telefone, CEP e estado inválidos", () => {
    const result = clientFormSchema.safeParse({
      ...validClient,
      primaryPhone: "123",
      zipCode: "1234",
      state: "Paraná",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.primaryPhone).toBeDefined();
      expect(errors.zipCode).toBeDefined();
      expect(errors.state).toBeDefined();
    }
  });

  it("aceita campos opcionais vazios como nulos", () => {
    const result = clientFormSchema.parse({
      ...validClient,
      alternatePhone: "",
      email: "",
      complement: "",
      notes: "",
    });

    expect(result.alternatePhone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.complement).toBeNull();
    expect(result.notes).toBeNull();
  });
});
