import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { DiagnosisForm } from "./diagnosis-form";

const { saveDiagnosisAction } = vi.hoisted(() => ({
  saveDiagnosisAction: vi.fn(),
}));

vi.mock("../actions/diagnostics", () => ({ saveDiagnosisAction }));

describe("formulário de diagnóstico", () => {
  it("apresenta os campos e preserva a previsão atual", () => {
    render(
      <DiagnosisForm
        expectedCompletionAt="2026-09-07T21:00:00.000Z"
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        version={2}
      />,
    );

    expect(screen.getByLabelText(/Diagnóstico técnico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Observações técnicas/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Previsão de conclusão/)).toHaveValue(
      "2026-09-07T18:00",
    );
    expect(screen.getByRole("button", { name: "Salvar diagnóstico" })).toBeInTheDocument();
  });

  it("valida a descrição antes de enviar", async () => {
    const user = userEvent.setup();
    render(
      <DiagnosisForm
        expectedCompletionAt={null}
        orderId="f74f53fe-83fd-4e44-9a35-9253204f711a"
        version={2}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar diagnóstico" }));

    expect(await screen.findByText("Informe o diagnóstico técnico.")).toBeInTheDocument();
    expect(saveDiagnosisAction).not.toHaveBeenCalled();
  });
});
