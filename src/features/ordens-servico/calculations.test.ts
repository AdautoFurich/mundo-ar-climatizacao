import { describe, expect, it } from "vitest";

import { calculateOrderTotals, calculateSubtotalCents } from "./calculations";

describe("cálculos da ordem", () => {
  it("arredonda o subtotal de cada item para o centavo mais próximo", () => {
    expect(calculateSubtotalCents(1500, 1999)).toBe(2999);
    expect(calculateSubtotalCents(125, 100)).toBe(13);
  });

  it("separa serviços e materiais e calcula o autorizado", () => {
    expect(
      calculateOrderTotals(
        [
          {
            type: "servico",
            quantityThousandths: 1000,
            unitPriceCents: 25000,
            approvalStatus: "aprovado",
          },
          {
            type: "material",
            quantityThousandths: 2000,
            unitPriceCents: 5000,
            approvalStatus: "recusado",
          },
          {
            type: "material",
            quantityThousandths: 500,
            unitPriceCents: 8000,
            approvalStatus: "aprovado",
          },
        ],
        2000,
      ),
    ).toEqual({
      servicesSubtotalCents: 25000,
      materialsSubtotalCents: 14000,
      quotedSubtotalCents: 39000,
      approvedSubtotalCents: 29000,
      discountCents: 2000,
      quotedTotalCents: 37000,
      approvedTotalCents: 27000,
    });
  });

  it("não inclui itens pendentes ou removidos no autorizado", () => {
    const totals = calculateOrderTotals([
      {
        type: "servico",
        quantityThousandths: 1000,
        unitPriceCents: 10000,
        approvalStatus: "pendente",
      },
      {
        type: "material",
        quantityThousandths: 1000,
        unitPriceCents: 5000,
        approvalStatus: "aprovado",
        removed: true,
      },
    ]);

    expect(totals.quotedSubtotalCents).toBe(10000);
    expect(totals.approvedSubtotalCents).toBe(0);
  });

  it("rejeita desconto acima do subtotal aplicável", () => {
    expect(() =>
      calculateOrderTotals(
        [
          {
            type: "servico",
            quantityThousandths: 1000,
            unitPriceCents: 10000,
            approvalStatus: "aprovado",
          },
        ],
        10001,
      ),
    ).toThrow("desconto");
  });
});
