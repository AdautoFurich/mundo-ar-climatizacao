import { render, screen, waitFor } from "@testing-library/react";
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
  beforeEach(() => {
    transferVehicleAction.mockReset();
    transferVehicleAction.mockResolvedValue({ status: "idle" });
  });

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

  it("envia o veículo e o novo proprietário selecionado", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <VehicleTransferForm
        clients={clients}
        currentOwnerId={clients[0].id}
        vehicleId="17a58c52-6c6d-43a3-a5c4-e71a464b45f2"
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Novo proprietário/ }),
      clients[1].id,
    );
    await user.click(screen.getByRole("button", { name: "Transferir veículo" }));

    await waitFor(() => expect(transferVehicleAction).toHaveBeenCalled());
    const formData = transferVehicleAction.mock.calls[0][1] as FormData;
    expect(formData.get("vehicleId")).toBe(
      "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
    );
    expect(formData.get("newOwnerId")).toBe(clients[1].id);
  });
});
