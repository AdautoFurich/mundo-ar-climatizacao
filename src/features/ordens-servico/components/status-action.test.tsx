import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import { OrderStatusAction } from "./status-action";

const { startDiagnosisAction } = vi.hoisted(() => ({
  startDiagnosisAction: vi.fn(),
}));

vi.mock("../actions/workflow", () => ({ startDiagnosisAction }));

describe("ação principal da ordem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite iniciar o diagnóstico somente quando a ordem está aberta", () => {
    const { rerender } = render(
      <OrderStatusAction
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="aberta"
        version={1}
      />,
    );
    expect(screen.getByRole("button", { name: "Iniciar diagnóstico" })).toBeInTheDocument();

    rerender(
      <OrderStatusAction
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="em_diagnostico"
        version={2}
      />,
    );
    expect(screen.queryByRole("button", { name: "Iniciar diagnóstico" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o diagnóstico" })).toHaveAttribute(
      "href",
      "#diagnostico-form",
    );
  });

  it("pede confirmação antes de iniciar", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <OrderStatusAction
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="aberta"
        version={1}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Iniciar diagnóstico" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Deseja iniciar o diagnóstico desta ordem?",
    );
    expect(startDiagnosisAction).not.toHaveBeenCalled();
  });

  it("não oferece avanço ainda nas demais situações", () => {
    render(
      <OrderStatusAction
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        status="aguardando_aprovacao"
        version={3}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
