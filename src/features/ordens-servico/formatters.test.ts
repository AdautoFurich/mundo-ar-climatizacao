import { describe, expect, it } from "vitest";

import {
  formatApprovalChannel,
  formatApprovalStatus,
  formatFuelLevel,
  formatMileage,
  formatOrderDate,
  formatOrderDateTimeInput,
  formatOrderMoney,
  formatOrderNumber,
  formatOrderQuantity,
  formatOrderStatus,
  formatPaymentMethod,
} from "./formatters";

describe("apresentação da ordem", () => {
  it("formata número, situação, dinheiro e quilometragem", () => {
    expect(formatOrderNumber(1)).toBe("OS #0001");
    expect(formatOrderNumber(12890)).toBe("OS #12890");
    expect(formatOrderStatus("pronta_retirada")).toBe("Pronta para retirada");
    expect(formatOrderMoney(123456)).toBe("R$ 1.234,56");
    expect(formatMileage(84520)).toBe("84.520 km");
  });

  it("formata datas no horário da oficina", () => {
    expect(formatOrderDate("2026-09-06T16:30:00.000Z")).toBe(
      "06/09/2026, 13:30",
    );
    expect(formatOrderDateTimeInput("2026-09-07T21:00:00.000Z")).toBe(
      "2026-09-07T18:00",
    );
    expect(formatOrderDateTimeInput(null)).toBe("");
  });

  it("formata dados operacionais complementares", () => {
    expect(formatFuelLevel("metade")).toBe("1/2");
    expect(formatApprovalStatus("aprovado")).toBe("Aprovado");
    expect(formatApprovalChannel("whatsapp")).toBe("WhatsApp");
    expect(formatPaymentMethod("cartao_credito")).toBe("Cartão de crédito");
    expect(formatOrderQuantity(1.25)).toBe("1,25");
  });
});
