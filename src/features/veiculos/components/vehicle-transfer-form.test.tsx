import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { VehicleTransferForm } from "./vehicle-transfer-form";

const { transferVehicleAction } = vi.hoisted(() => ({
  transferVehicleAction: vi.fn(),
}));

vi.mock("../actions", () => ({ transferVehicleAction }));

const clients = [
  {
    id: "87a32e64-7e85-49d5-b518-6a899b00ce21",
    name: "Maria da Silva",
    cpf: "52998224725",
  },
  {
    id: "8a23bfe3-7797-49ac-9303-8060958203bc",
    name: "João Pereira",
    cpf: "11144477735",
  },
];

describe("transferência de veículo", () => {
  it("não oferece o proprietário atual como destino", () => {
    render(
      <VehicleTransferForm
        clients={clients}
        currentOwnerId={clients[0].id}
        vehicleId="17a58c52-6c6d-43a3-a5c4-e71a464b45f2"
      />,
    );

    expect(screen.queryByRole("option", { name: /Maria da Silva/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /João Pereira/ })).toBeInTheDocument();
  });

  it("exige um novo proprietário antes de enviar", async () => {
    const user = userEvent.setup();
    render(
      <VehicleTransferForm
        clients={clients}
        currentOwnerId={clients[0].id}
        vehicleId="17a58c52-6c6d-43a3-a5c4-e71a464b45f2"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Transferir veículo" }));
    expect(
      await screen.findByText("Selecione um novo proprietário válido."),
    ).toBeInTheDocument();
    expect(transferVehicleAction).not.toHaveBeenCalled();
  });
});
