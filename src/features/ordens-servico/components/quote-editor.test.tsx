import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderServiceOption, ServiceOrderItem } from "../types";
import { QuoteEditor } from "./quote-editor";

const { addOrderItemAction } = vi.hoisted(() => ({
  addOrderItemAction: vi.fn(
    async (
      orderId: string,
      version: number,
      previousState: unknown,
      formData: FormData,
    ) => {
      void orderId;
      void version;
      void previousState;
      void formData;
      return { status: "idle" as const };
    },
  ),
}));

vi.mock("../actions/items", () => ({
  addOrderItemAction,
  updateOrderItemAction: vi.fn(),
  removeOrderItemAction: vi.fn(),
  applyOrderDiscountAction: vi.fn(),
}));
vi.mock("../actions/workflow", () => ({
  sendQuoteForApprovalAction: vi.fn(),
}));

const services: OrderServiceOption[] = [
  {
    id: "241a81ad-8f70-4c3c-a162-a763d8258d93",
    name: "Higienização completa",
    category: "climatizacao",
    basePrice: 250,
  },
];

const items: ServiceOrderItem[] = [
  {
    id: "669999f7-c1d7-4ca2-9e55-2e1a6ddf8f93",
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
    order: 0,
    removedAt: null,
    createdById: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
    createdByName: "Adauto Furich",
    createdAt: "2026-09-07T12:00:00.000Z",
    updatedAt: "2026-09-07T12:00:00.000Z",
  },
];

const defaultProps = {
  discount: 0,
  hasDiagnosis: true,
  items,
  materialsSubtotal: 7500,
  orderId: "f74f53fe-83fd-4e44-9a35-9253204f711a",
  quotedTotal: 7500,
  services,
  servicesSubtotal: 0,
  status: "em_diagnostico" as const,
  userRole: "administrador" as const,
  version: 3,
};

describe("editor de orçamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe formulário, itens, totais e desconto para administrador", () => {
    render(<QuoteEditor {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Adicionar item" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Higienização completa/ })).toBeInTheDocument();
    expect(screen.getByText("Filtro de cabine")).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*75,00/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Aplicar desconto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar para aprovação" })).toBeEnabled();
  });

  it("bloqueia o envio enquanto não houver item", () => {
    render(<QuoteEditor {...defaultProps} items={[]} />);
    expect(screen.getByRole("button", { name: "Enviar para aprovação" })).toBeDisabled();
    expect(screen.getByText("Adicione ao menos um item antes de enviar.")).toBeInTheDocument();
  });

  it("preenche descrição e preço ao selecionar um serviço", async () => {
    const user = userEvent.setup();
    render(<QuoteEditor {...defaultProps} items={[]} />);
    await user.selectOptions(
      screen.getByLabelText(/^Serviço do catálogo/),
      services[0].id,
    );
    expect(screen.getByLabelText(/^Descrição do item/)).toHaveValue(
      "Higienização completa",
    );
    expect(screen.getByLabelText(/^Valor unitário/)).toHaveValue("250,00");
  });

  it("envia quantidade e valor com os nomes esperados pelo servidor", async () => {
    const user = userEvent.setup();
    render(<QuoteEditor {...defaultProps} items={[]} />);
    await user.selectOptions(
      screen.getByLabelText(/^Serviço do catálogo/),
      services[0].id,
    );
    await user.clear(screen.getByLabelText(/^Valor unitário/));
    await user.type(screen.getByLabelText(/^Valor unitário/), "200");
    await user.click(screen.getByRole("button", { name: "Adicionar ao orçamento" }));

    await waitFor(() => expect(addOrderItemAction).toHaveBeenCalled());
    const submitted = addOrderItemAction.mock.calls[0][3] as FormData;
    expect(submitted.get("quantity")).toBe("1");
    expect(submitted.get("unitPrice")).toBe("200,00");
  });

  it("oculta o desconto para atendentes", () => {
    render(<QuoteEditor {...defaultProps} userRole="atendente" />);
    expect(screen.queryByRole("heading", { name: "Aplicar desconto" })).not.toBeInTheDocument();
    expect(screen.getByText("Desconto")).toBeInTheDocument();
  });
});
