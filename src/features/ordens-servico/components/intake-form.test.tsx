import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { IntakeForm } from "./intake-form";

const { createServiceOrderAction, listVehiclesForOrderAction } = vi.hoisted(
  () => ({
    createServiceOrderAction: vi.fn(),
    listVehiclesForOrderAction: vi.fn(),
  }),
);

vi.mock("../actions/intake", () => ({
  createServiceOrderAction,
  listVehiclesForOrderAction,
}));

const client = {
  id: "87a32e64-7e85-49d5-b518-6a899b00ce21",
  name: "Maria da Silva",
  cpf: "52998224725",
};

const currentUser = {
  id: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
  name: "Adauto Furich",
  role: "administrador" as const,
};

describe("abertura de ordem de serviço", () => {
  it("apresenta as seções e inicia com o usuário atual como responsável", () => {
    render(
      <IntakeForm
        clients={[client]}
        currentUserId={currentUser.id}
        defaultEntryAt="2026-09-06T18:30"
        responsibles={[currentUser]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Atendimento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrada do veículo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Condições de entrada" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Responsável/)).toHaveValue(currentUser.id);
    expect(screen.getByLabelText(/Data e hora de entrada/)).toHaveValue(
      "2026-09-06T18:30",
    );
  });

  it("carrega somente os veículos do cliente selecionado", async () => {
    const user = userEvent.setup();
    listVehiclesForOrderAction.mockResolvedValueOnce([
      {
        id: "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
        clientId: client.id,
        plate: "ABC1D23",
        label: "Chevrolet Onix",
      },
    ]);

    render(
      <IntakeForm
        clients={[client]}
        currentUserId={currentUser.id}
        defaultEntryAt="2026-09-06T18:30"
        responsibles={[currentUser]}
      />,
    );

    const vehicleSelect = screen.getByLabelText(/Veículo/);
    expect(vehicleSelect).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/Cliente/), client.id);

    expect(listVehiclesForOrderAction).toHaveBeenCalledWith(client.id);
    expect(
      await screen.findByRole("option", { name: "ABC1D23 — Chevrolet Onix" }),
    ).toBeInTheDocument();
    expect(vehicleSelect).toBeEnabled();
  });

  it("valida os campos obrigatórios antes de enviar", async () => {
    const user = userEvent.setup();
    render(
      <IntakeForm
        clients={[client]}
        currentUserId={currentUser.id}
        defaultEntryAt="2026-09-06T18:30"
        responsibles={[currentUser]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Abrir ordem de serviço" }));

    expect(await screen.findByText("Selecione um cliente válido.")).toBeInTheDocument();
    expect(screen.getByText("Selecione um veículo válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe a quilometragem sem casas decimais.")).toBeInTheDocument();
    expect(screen.getByText("Informe o relato do cliente.")).toBeInTheDocument();
    expect(createServiceOrderAction).not.toHaveBeenCalled();
  });
});
