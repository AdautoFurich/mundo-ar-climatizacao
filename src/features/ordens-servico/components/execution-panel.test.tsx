import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

import type { ServiceOrderItem } from "../types";
import { ExecutionPanel } from "./execution-panel";

const { markReadyForPickupAction, setOrderItemExecutedAction, startExecutionAction } =
  vi.hoisted(() => ({
    markReadyForPickupAction: vi.fn(),
    setOrderItemExecutedAction: vi.fn(),
    startExecutionAction: vi.fn(),
  }));

vi.mock("../actions/execution", () => ({ setOrderItemExecutedAction }));
vi.mock("../actions/workflow", () => ({
  markReadyForPickupAction,
  startExecutionAction,
}));

const baseItem: ServiceOrderItem = {
  id: "669999f7-c1d7-4ca2-9e55-2e1a6ddf8f93",
  type: "servico",
  serviceId: null,
  description: "Higienização do sistema",
  quantity: 1,
  unitPrice: 20000,
  subtotal: 20000,
  approvalStatus: "aprovado",
  executedAt: null,
  executedById: null,
  executedByName: null,
  order: 1,
  removedAt: null,
  createdById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
  createdByName: "Adauto Furich",
  createdAt: "2026-09-07T12:00:00.000Z",
  updatedAt: "2026-09-07T12:00:00.000Z",
};

describe("painel de execução", () => {
  beforeEach(() => vi.clearAllMocks());

  it("oferece o início quando a ordem está aprovada", () => {
    render(
      <ExecutionPanel
        items={[baseItem]}
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="aprovada"
        version={4}
      />,
    );

    expect(screen.getByText("1 item autorizado para executar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar execução" })).toBeInTheDocument();
  });

  it("mostra somente itens aprovados e mantém a retirada bloqueada", () => {
    render(
      <ExecutionPanel
        items={[
          baseItem,
          {
            ...baseItem,
            id: "769999f7-c1d7-4ca2-9e55-2e1a6ddf8f94",
            description: "Troca do filtro",
            approvalStatus: "recusado",
          },
        ]}
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="em_execucao"
        version={5}
      />,
    );

    expect(screen.getByText("0 de 1 concluído")).toBeInTheDocument();
    expect(screen.getByText("Higienização do sistema")).toBeInTheDocument();
    expect(screen.queryByText("Troca do filtro")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Concluir Higienização/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Liberar para retirada" })).toBeDisabled();
  });

  it("libera a retirada quando todos os itens foram executados", () => {
    render(
      <ExecutionPanel
        items={[{ ...baseItem, executedAt: "2026-09-07T13:00:00.000Z" }]}
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="em_execucao"
        version={6}
      />,
    );

    expect(screen.getByText("1 de 1 concluído")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desfazer conclusão de Higienização/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Liberar para retirada" })).toBeEnabled();
  });
});
