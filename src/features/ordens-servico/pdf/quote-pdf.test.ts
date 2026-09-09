import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { ServiceOrderDetails, ServiceOrderItem } from "../types";
import { createQuotePdf, quotePdfFilename } from "./quote-pdf";

function item(index: number): ServiceOrderItem {
  return {
    id: `item-${index}`,
    type: index % 2 === 0 ? "material" : "servico",
    serviceId: null,
    description: `Item detalhado do orçamento número ${index}`,
    quantity: 1,
    unitPrice: 10000,
    subtotal: 10000,
    approvalStatus: "pendente",
    executedAt: null,
    executedById: null,
    executedByName: null,
    order: index,
    removedAt: null,
    createdById: "user-1",
    createdByName: "Adauto Furich",
    createdAt: "2026-09-07T12:00:00.000Z",
    updatedAt: "2026-09-07T12:00:00.000Z",
  };
}

function order(items = [item(1)]): ServiceOrderDetails {
  return {
    id: "order-1",
    number: 18,
    status: "em_diagnostico",
    clientName: "Maria da Silva",
    clientCpf: "52998224725",
    clientPhone: "44999999999",
    vehicleBrand: "Chevrolet",
    vehicleModel: "Onix",
    vehiclePlate: "ABC1D23",
    vehicleManufactureYear: 2020,
    vehicleModelYear: 2021,
    customerComplaint: "Ar-condicionado não está resfriando.",
    servicesSubtotal: items.filter((entry) => entry.type === "servico").length * 10000,
    materialsSubtotal: items.filter((entry) => entry.type === "material").length * 10000,
    discount: 0,
    quotedTotal: items.length * 10000,
    diagnoses: [
      {
        id: "diagnosis-1",
        description: "Baixa pressão no circuito e filtro saturado.",
        notes: null,
        expectedCompletionAt: null,
        authorId: "user-1",
        authorName: "Adauto Furich",
        createdAt: "2026-09-07T12:00:00.000Z",
      },
    ],
    items,
    entryAt: "2026-09-07T10:00:00.000Z",
  } as ServiceOrderDetails;
}

describe("PDF do orçamento", () => {
  it("gera um PDF A4 identificado pela ordem", async () => {
    const bytes = await createQuotePdf(order(), {
      generatedAt: new Date("2026-09-07T15:00:00.000Z"),
    });
    const pdf = await PDFDocument.load(bytes);

    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-");
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe("Orçamento - OS #0018");
    expect(quotePdfFilename(18)).toBe("orcamento-os-0018.pdf");
  });

  it("cria páginas adicionais quando o orçamento possui muitos itens", async () => {
    const bytes = await createQuotePdf(
      order(Array.from({ length: 30 }, (_, index) => item(index + 1))),
    );
    const pdf = await PDFDocument.load(bytes);

    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
