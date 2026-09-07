import { render, screen } from "@testing-library/react";

import type { ServiceOrderDetails } from "../types";
import { OrderDetail } from "./order-detail";
import { OrderSummary } from "./order-summary";
import { OrderTimeline } from "./timeline";

const order: ServiceOrderDetails = {
  id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
  number: 18,
  status: "em_diagnostico",
  clientId: "87a32e64-7e85-49d5-b518-6a899b00ce21",
  clientName: "Maria da Silva",
  clientCpf: "52998224725",
  clientPhone: "44999999999",
  vehicleId: "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
  vehiclePlate: "ABC1D23",
  vehicleLabel: "Chevrolet Onix",
  vehicleBrand: "Chevrolet",
  vehicleModel: "Onix",
  vehicleManufactureYear: 2020,
  vehicleModelYear: 2021,
  responsibleId: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
  responsibleName: "Adauto Furich",
  entryAt: "2026-09-05T11:30:00.000Z",
  expectedCompletionAt: "2026-09-05T18:00:00.000Z",
  authorizedTotal: 48750,
  updatedAt: "2026-09-05T14:00:00.000Z",
  overdue: true,
  mileage: 84520,
  fuelLevel: "metade",
  customerComplaint: "Ar não está resfriando.",
  accessories: "Controle do alarme",
  visibleDamage: "Risco no para-choque dianteiro",
  intakeNotes: null,
  servicesSubtotal: 35000,
  materialsSubtotal: 13750,
  quotedSubtotal: 48750,
  approvedSubtotal: 48750,
  discount: 0,
  quotedTotal: 48750,
  finalTotal: 0,
  version: 2,
  createdById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
  createdByName: "Adauto Furich",
  updatedById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
  updatedByName: "Adauto Furich",
  createdAt: "2026-09-05T11:30:00.000Z",
  diagnoses: [
    {
      id: "5af49635-2e37-4fbf-801e-0a2c0d8d4b91",
      description: "Baixa pressão no circuito e filtro saturado.",
      notes: null,
      expectedCompletionAt: "2026-09-05T18:00:00.000Z",
      authorId: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
      authorName: "Adauto Furich",
      createdAt: "2026-09-05T13:00:00.000Z",
    },
  ],
  items: [
    {
      id: "669999f7-c1d7-4ca2-9e55-2e1a6ddf8f93",
      type: "servico",
      serviceId: "241a81ad-8f70-4c3c-a162-a763d8258d93",
      description: "Higienização do sistema",
      quantity: 1,
      unitPrice: 35000,
      subtotal: 35000,
      approvalStatus: "aprovado",
      executedAt: null,
      executedById: null,
      executedByName: null,
      order: 1,
      removedAt: null,
      createdById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
      createdByName: "Adauto Furich",
      createdAt: "2026-09-05T13:10:00.000Z",
      updatedAt: "2026-09-05T13:10:00.000Z",
    },
  ],
  approvals: [],
  delivery: null,
  history: [
    {
      id: "b594977e-16df-422a-88db-99371edc3d18",
      event: "diagnostico_registrado",
      previousStatus: "aberta",
      nextStatus: "em_diagnostico",
      summary: "Diagnóstico técnico registrado.",
      justification: null,
      metadata: {},
      authorId: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
      authorName: "Adauto Furich",
      createdAt: "2026-09-05T13:00:00.000Z",
    },
  ],
};

describe("detalhes da ordem de serviço", () => {
  it("mantém os dados operacionais principais visíveis no resumo", () => {
    render(<OrderSummary order={order} />);

    expect(screen.getByRole("heading", { name: "OS #0018" })).toBeInTheDocument();
    expect(screen.getByText("Em diagnóstico")).toBeInTheDocument();
    expect(screen.getByText("Maria da Silva")).toBeInTheDocument();
    expect(screen.getByText("Chevrolet Onix")).toBeInTheDocument();
    expect(screen.getByText("Adauto Furich")).toBeInTheDocument();
    expect(screen.getByText(/487,50/)).toBeInTheDocument();
    expect(screen.getByText("Atrasada")).toBeInTheDocument();
    expect(screen.getByText("Registrar diagnóstico técnico")).toBeInTheDocument();
  });

  it("organiza entrada, diagnóstico, orçamento, execução e entrega", () => {
    render(<OrderDetail order={order} />);

    expect(screen.getByRole("heading", { name: "Entrada do veículo" })).toBeInTheDocument();
    expect(screen.getByText("84.520 km")).toBeInTheDocument();
    expect(screen.getByText("Ar não está resfriando.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Diagnóstico" })).toBeInTheDocument();
    expect(screen.getByText("Baixa pressão no circuito e filtro saturado.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orçamento e autorizações" })).toBeInTheDocument();
    expect(screen.getByText("Higienização do sistema")).toBeInTheDocument();
    expect(screen.getByText("1 item autorizado aguardando execução.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrega" })).toBeInTheDocument();
    expect(screen.getByText("Entrega ainda não registrada.")).toBeInTheDocument();
  });

  it("exibe autoria, horário e mudança de situação no histórico", () => {
    const { rerender } = render(<OrderTimeline events={order.history} />);

    expect(screen.getByText("Diagnóstico técnico registrado.")).toBeInTheDocument();
    expect(screen.getByText(/Por Adauto Furich/)).toBeInTheDocument();
    expect(screen.getByText("Aberta → Em diagnóstico")).toBeInTheDocument();

    rerender(<OrderTimeline events={[]} />);
    expect(screen.getByText("Nenhum evento registrado.")).toBeInTheDocument();
  });

  it("mantém o histórico auditável das decisões do cliente", () => {
    render(
      <OrderDetail
        order={{
          ...order,
          approvals: [
            {
              id: "869999f7-c1d7-4ca2-9e55-2e1a6ddf8f95",
              itemId: order.items[0].id,
              decision: "aprovado",
              channel: "whatsapp",
              respondedAt: "2026-09-05T16:00:00.000Z",
              notes: "Cliente confirmou por mensagem.",
              authorId: order.responsibleId,
              authorName: "Adauto Furich",
              createdAt: "2026-09-05T16:01:00.000Z",
            },
          ],
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Histórico de aprovações" })).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp · resposta em/)).toBeInTheDocument();
    expect(screen.getByText("Cliente confirmou por mensagem.")).toBeInTheDocument();
  });
});
