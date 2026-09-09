import type { CalculableOrderItem, OrderTotals } from "./types";

function assertSafeNonNegativeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} deve ser um inteiro não negativo.`);
  }
}

export function calculateSubtotalCents(
  quantityThousandths: number,
  unitPriceCents: number,
) {
  if (!Number.isSafeInteger(quantityThousandths) || quantityThousandths <= 0) {
    throw new Error("A quantidade deve ser positiva.");
  }
  assertSafeNonNegativeInteger(unitPriceCents, "O valor unitário");

  const product = BigInt(quantityThousandths) * BigInt(unitPriceCents);
  const rounded = (product + BigInt(500)) / BigInt(1000);
  const result = Number(rounded);
  if (!Number.isSafeInteger(result)) {
    throw new Error("O subtotal está acima do limite permitido.");
  }
  return result;
}

export function calculateOrderTotals(
  items: readonly CalculableOrderItem[],
  discountCents = 0,
): OrderTotals {
  assertSafeNonNegativeInteger(discountCents, "O desconto");

  let servicesSubtotalCents = 0;
  let materialsSubtotalCents = 0;
  let approvedSubtotalCents = 0;

  for (const item of items) {
    if (item.removed) continue;
    const subtotal = calculateSubtotalCents(
      item.quantityThousandths,
      item.unitPriceCents,
    );
    if (item.type === "servico") servicesSubtotalCents += subtotal;
    else materialsSubtotalCents += subtotal;
    if (item.approvalStatus === "aprovado") approvedSubtotalCents += subtotal;
  }

  const quotedSubtotalCents = servicesSubtotalCents + materialsSubtotalCents;
  const applicableSubtotal =
    approvedSubtotalCents > 0 ? approvedSubtotalCents : quotedSubtotalCents;
  if (discountCents > applicableSubtotal) {
    throw new Error("O desconto não pode ultrapassar o subtotal aplicável.");
  }

  return {
    servicesSubtotalCents,
    materialsSubtotalCents,
    quotedSubtotalCents,
    approvedSubtotalCents,
    discountCents,
    quotedTotalCents: Math.max(0, quotedSubtotalCents - discountCents),
    approvedTotalCents: Math.max(0, approvedSubtotalCents - discountCents),
  };
}
