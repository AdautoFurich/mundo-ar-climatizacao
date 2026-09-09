import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceOrderItem } from "../types";
import { ApprovalPanel } from "./approval-panel";

const { registerOrderApprovalsAction } = vi.hoisted(() => ({
  registerOrderApprovalsAction: vi.fn(
    async (orderId: string, previousState: unknown, formData: FormData) => {
      void orderId;
      void previousState;
      void formData;
      return { status: "idle" as const };
    },
  ),
}));

vi.mock("../actions/approvals", () => ({ registerOrderApprovalsAction }));

const items: ServiceOrderItem[] = [
  {
    id: "669999f7-c1d7-4ca2-9e55-2e1a6ddf8f93",
    type: "servico",
    serviceId: "241a81ad-8f70-4c3c-a162-a763d8258d93",
    description: "Higienização completa",
    quantity: 1,
    unitPrice: 25000,
    subtotal: 25000,
    approvalStatus: "pendente",
    executedAt: null,
    executedById: null,
    executedByName: null,
    order: 0,
    removedAt: null,
    createdById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
    createdByName: "Adauto Furich",
    createdAt: "2026-09-08T12:00:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
  },
  {
    id: "769999f7-c1d7-4ca2-9e55-2e1a6ddf8f94",
    type: "material",
    serviceId: null,
    description: "Filtro de cabine",
    quantity: 1,
    unitPrice: 7500,
    subtotal: 7500,
    approvalStatus: "pendente",
    executedAt: null,
    executedById: null,
    executedByName: null,
    order: 1,
    removedAt: null,
    createdById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
    createdByName: "Adauto Furich",
    createdAt: "2026-09-08T12:00:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
  },
];

const defaultProps = {
  items,
  orderId: "f74f53fe-83fd-4e44-9a35-9253204f711a",
  respondedAtDefault: "2026-09-08T15:00:00.000Z",
  version: 5,
};

describe("painel de aprovação", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe itens e dados obrigatórios da resposta", () => {
    render(<ApprovalPanel {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Registrar resposta do cliente" })).toBeInTheDocument();
    expect(screen.getAllByText("Higienização completa").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Canal da resposta")).toBeInTheDocument();
    expect(screen.getByLabelText("Data e hora da resposta")).toBeInTheDocument();
  });

  it("preenche todas as decisões com o atalho de aprovação", async () => {
    const user = userEvent.setup();
    render(<ApprovalPanel {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Aprovar todos" }));
    expect(screen.getByLabelText("Decisão para Higienização completa")).toHaveValue("aprovado");
    expect(screen.getByLabelText("Decisão para Filtro de cabine")).toHaveValue("aprovado");
  });

  it("impede o envio sem qualquer decisão", async () => {
    const user = userEvent.setup();
    render(<ApprovalPanel {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Registrar decisões" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha ao menos uma decisão");
    expect(registerOrderApprovalsAction).not.toHaveBeenCalled();
  });

  it("envia somente as decisões escolhidas com os dados da resposta", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ApprovalPanel {...defaultProps} />);
    await user.selectOptions(
      screen.getByLabelText("Decisão para Higienização completa"),
      "aprovado",
    );
    await user.click(screen.getByRole("button", { name: "Registrar decisões" }));

    await waitFor(() => expect(registerOrderApprovalsAction).toHaveBeenCalled());
    const submitted = registerOrderApprovalsAction.mock.calls[0][2];
    expect(JSON.parse(String(submitted.get("decisions")))).toEqual([
      { itemId: items[0].id, decision: "aprovado" },
    ]);
    expect(submitted.get("channel")).toBe("whatsapp");
  });
});
