import { describe, expect, it } from "vitest";

import {
  APPROVAL_CHANNEL_VALUES,
  approvalSchema,
  deliverySchema,
  FUEL_LEVEL_VALUES,
  intakeSchema,
  orderItemSchema,
  parseBrazilianCurrencyToCents,
  parseQuantityToThousandths,
} from "./schemas";

const UUIDS = {
  client: "10000000-0000-4000-8000-000000000001",
  vehicle: "10000000-0000-4000-8000-000000000002",
  responsible: "10000000-0000-4000-8000-000000000003",
  service: "10000000-0000-4000-8000-000000000004",
};

const validIntake = {
  clientId: UUIDS.client,
  vehicleId: UUIDS.vehicle,
  responsibleId: UUIDS.responsible,
  entryAt: "2026-09-06T13:00:00-03:00",
  mileage: "84520",
  fuelLevel: "metade",
  customerComplaint: "  Ar não está   resfriando.  ",
  expectedCompletionAt: "2026-09-07T18:00:00-03:00",
  accessories: "  Controle do alarme  ",
  visibleDamage: "",
  notes: "",
};

describe("validação da entrada da ordem", () => {
  it("normaliza os dados válidos", () => {
    expect(intakeSchema.parse(validIntake)).toEqual({
      clientId: UUIDS.client,
      vehicleId: UUIDS.vehicle,
      responsibleId: UUIDS.responsible,
      entryAt: "2026-09-06T16:00:00.000Z",
      mileage: 84520,
      fuelLevel: "metade",
      customerComplaint: "Ar não está resfriando.",
      expectedCompletionAt: "2026-09-07T21:00:00.000Z",
      accessories: "Controle do alarme",
      visibleDamage: null,
      notes: null,
    });
  });

  it("aceita somente identificadores, combustível e datas válidos", () => {
    expect(FUEL_LEVEL_VALUES).toHaveLength(5);
    expect(
      intakeSchema.safeParse({ ...validIntake, clientId: "cliente" }).success,
    ).toBe(false);
    expect(
      intakeSchema.safeParse({ ...validIntake, fuelLevel: "desconhecido" }).success,
    ).toBe(false);
    expect(
      intakeSchema.safeParse({ ...validIntake, entryAt: "06/09/2026 13:00" })
        .success,
    ).toBe(false);
  });

  it("rejeita quilometragem negativa, decimal ou acima do limite", () => {
    for (const mileage of ["-1", "1,5", "10000000", "oitenta mil"]) {
      expect(intakeSchema.safeParse({ ...validIntake, mileage }).success).toBe(
        false,
      );
    }
  });

  it("exige relato e previsão posterior à entrada", () => {
    expect(
      intakeSchema.safeParse({ ...validIntake, customerComplaint: " " }).success,
    ).toBe(false);
    expect(
      intakeSchema.safeParse({
        ...validIntake,
        expectedCompletionAt: "2026-09-06T12:00:00-03:00",
      }).success,
    ).toBe(false);
  });
});

describe("validação monetária e dos itens", () => {
  it("converte valores brasileiros em centavos", () => {
    expect(parseBrazilianCurrencyToCents("0")).toBe(0);
    expect(parseBrazilianCurrencyToCents("1.234,56")).toBe(123456);
    expect(parseBrazilianCurrencyToCents("9.999.999.999,99")).toBe(
      999999999999,
    );
  });

  it("rejeita valores monetários inválidos", () => {
    for (const value of ["-1", "1.23", "12,345", "valor", "10.000.000.000,00"]) {
      expect(() => parseBrazilianCurrencyToCents(value)).toThrow();
    }
  });

  it("converte quantidades com até três casas", () => {
    expect(parseQuantityToThousandths("1")).toBe(1000);
    expect(parseQuantityToThousandths("1,5")).toBe(1500);
    expect(parseQuantityToThousandths("0,125")).toBe(125);
  });

  it("valida serviços e materiais sem aceitar relações incoerentes", () => {
    expect(
      orderItemSchema.parse({
        type: "servico",
        serviceId: UUIDS.service,
        description: "  Higienização completa ",
        quantity: "1",
        unitPrice: "250,00",
      }),
    ).toMatchObject({
      type: "servico",
      serviceId: UUIDS.service,
      description: "Higienização completa",
      quantityThousandths: 1000,
      unitPriceCents: 25000,
    });

    expect(
      orderItemSchema.parse({
        type: "material",
        serviceId: "",
        description: "Gás refrigerante",
        quantity: "0,5",
        unitPrice: "180,00",
      }),
    ).toMatchObject({ type: "material", serviceId: null });

    expect(
      orderItemSchema.safeParse({
        type: "servico",
        serviceId: "",
        description: "Carga de gás",
        quantity: "1",
        unitPrice: "150,00",
      }).success,
    ).toBe(false);
  });

  it("mantém somente os canais de aprovação definidos", () => {
    expect(APPROVAL_CHANNEL_VALUES).toEqual([
      "whatsapp",
      "telefone",
      "presencial",
    ]);
  });

  it("exige uma decisão final e os dados da resposta", () => {
    const validApproval = {
      itemId: UUIDS.service,
      decision: "aprovado",
      channel: "whatsapp",
      respondedAt: "2026-09-06T15:00:00-03:00",
      notes: " Cliente autorizou por mensagem. ",
      expectedVersion: "2",
    };
    expect(approvalSchema.parse(validApproval)).toMatchObject({
      decision: "aprovado",
      channel: "whatsapp",
      notes: "Cliente autorizou por mensagem.",
      expectedVersion: 2,
    });
    expect(
      approvalSchema.safeParse({ ...validApproval, decision: "pendente" }).success,
    ).toBe(false);
    expect(
      approvalSchema.safeParse({ ...validApproval, channel: "email" }).success,
    ).toBe(false);
  });

  it("valida os dados simplificados da entrega", () => {
    expect(
      deliverySchema.safeParse({
        paymentMethod: "pix",
        deliveredAt: "2026-09-07T17:30:00-03:00",
        notes: "",
        expectedVersion: 8,
      }).success,
    ).toBe(true);
    expect(
      deliverySchema.safeParse({
        paymentMethod: "pix",
        deliveredAt: "2026-02-30T17:30:00-03:00",
        notes: "",
        expectedVersion: 8,
      }).success,
    ).toBe(false);
    expect(
      deliverySchema.safeParse({
        paymentMethod: "boleto",
        deliveredAt: "2026-09-07T17:30:00-03:00",
        notes: "",
        expectedVersion: 8,
      }).success,
    ).toBe(false);
  });
});
