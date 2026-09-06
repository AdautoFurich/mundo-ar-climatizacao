import { describe, expect, it } from "vitest";

import {
  SERVICE_CATEGORY_VALUES,
  normalizeServiceText,
  serviceFormSchema,
} from "./schemas";
import { formatBasePrice, formatServiceCategory } from "./formatters";

const validService = {
  name: "  Higienização   do ar-condicionado ",
  category: "climatizacao",
  description: "  Limpeza completa   do sistema. ",
  basePrice: "1.234,56",
};

describe("validação de serviços", () => {
  it("normaliza nome e descrição antes da gravação", () => {
    expect(normalizeServiceText("  Carga   de gás  ")).toBe("Carga de gás");
    expect(serviceFormSchema.parse(validService)).toEqual({
      name: "Higienização do ar-condicionado",
      category: "climatizacao",
      description: "Limpeza completa do sistema.",
      basePrice: "1234.56",
    });
  });

  it("aceita descrição e valor-base vazios como nulos", () => {
    expect(
      serviceFormSchema.parse({
        ...validService,
        description: "",
        basePrice: "",
      }),
    ).toMatchObject({ description: null, basePrice: null });
  });

  it("aceita somente as categorias previstas", () => {
    expect(SERVICE_CATEGORY_VALUES).toHaveLength(5);
    for (const category of SERVICE_CATEGORY_VALUES) {
      expect(
        serviceFormSchema.safeParse({ ...validService, category }).success,
      ).toBe(true);
    }
    expect(
      serviceFormSchema.safeParse({ ...validService, category: "estoque" }).success,
    ).toBe(false);
  });

  it("rejeita nome vazio ou acima do limite", () => {
    expect(serviceFormSchema.safeParse({ ...validService, name: " " }).success).toBe(
      false,
    );
    expect(
      serviceFormSchema.safeParse({ ...validService, name: "a".repeat(101) })
        .success,
    ).toBe(false);
  });

  it("converte valores monetários brasileiros válidos", () => {
    for (const [input, expected] of [
      ["0", "0.00"],
      ["0,5", "0.50"],
      ["150,00", "150.00"],
      ["9.999.999.999,99", "9999999999.99"],
    ]) {
      expect(
        serviceFormSchema.parse({ ...validService, basePrice: input }).basePrice,
      ).toBe(expected);
    }
  });

  it("rejeita valores negativos, inválidos ou fora do limite", () => {
    for (const basePrice of [
      "-1,00",
      "12,345",
      "1.23",
      "gratuito",
      "10.000.000.000,00",
    ]) {
      expect(
        serviceFormSchema.safeParse({ ...validService, basePrice }).success,
      ).toBe(false);
    }
  });

  it("respeita os limites dos campos opcionais", () => {
    expect(
      serviceFormSchema.safeParse({
        ...validService,
        description: "a".repeat(1001),
      }).success,
    ).toBe(false);
  });
});

describe("apresentação de serviços", () => {
  it("formata categoria e valor-base para pt-BR", () => {
    expect(formatServiceCategory("eletrica_automotiva")).toBe(
      "Elétrica automotiva",
    );
    expect(formatBasePrice("1234.56")).toBe("R$ 1.234,56");
    expect(formatBasePrice(null)).toBe("A definir");
  });
});
