import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeliveryForm } from "./delivery-form";

const { deliverOrderAction } = vi.hoisted(() => ({
  deliverOrderAction: vi.fn(
    async (orderId: string, previousState: unknown, formData: FormData) => {
      void orderId;
      void previousState;
      void formData;
      return { status: "idle" as const };
    },
  ),
}));

vi.mock("../actions/delivery", () => ({ deliverOrderAction }));

const defaultProps = {
  authorizedTotal: 48750,
  deliveredAtDefault: "2026-09-07T20:30:00.000Z",
  orderId: "f74f53fe-83fd-4e44-9a35-9253204f711a",
  version: 8,
};

describe("formulário de entrega", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe somente os dados necessários para concluir o atendimento", () => {
    render(<DeliveryForm {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "Registrar pagamento e entrega" })).toBeInTheDocument();
    expect(screen.getByText(/487,50/)).toBeInTheDocument();
    expect(screen.getByLabelText("Forma de pagamento")).toHaveValue("pix");
    expect(screen.getByLabelText("Data e hora da entrega")).toHaveValue("2026-09-07T17:30");
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("pede confirmação e envia os dados preenchidos", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DeliveryForm {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "dinheiro");
    await user.type(screen.getByLabelText("Observações"), "Chaves entregues.");
    await user.click(screen.getByRole("button", { name: "Confirmar pagamento e entrega" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Confirmar o pagamento e a entrega do veículo? Esta ação finalizará a ordem.",
    );
    await waitFor(() => expect(deliverOrderAction).toHaveBeenCalled());
    const submitted = deliverOrderAction.mock.calls[0][2];
    expect(submitted.get("paymentMethod")).toBe("dinheiro");
    expect(submitted.get("notes")).toBe("Chaves entregues.");
    expect(submitted.get("expectedVersion")).toBe("8");
  });

  it("não envia quando a confirmação é cancelada", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeliveryForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Confirmar pagamento e entrega" }));

    expect(deliverOrderAction).not.toHaveBeenCalled();
  });
});
