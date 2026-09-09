import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { VehicleForm } from "./vehicle-form";

const { createVehicleAction, updateVehicleAction } = vi.hoisted(() => ({
  createVehicleAction: vi.fn(),
  updateVehicleAction: vi.fn(),
}));

vi.mock("../actions", () => ({
  createVehicleAction,
  updateVehicleAction,
}));

const clients = [
  {
    id: "87a32e64-7e85-49d5-b518-6a899b00ce21",
    name: "Maria da Silva",
    cpf: "52998224725",
  },
];

describe("formulário de veículos", () => {
  it("apresenta as seções e valida campos obrigatórios", async () => {
    const user = userEvent.setup();
    render(<VehicleForm clients={clients} />);

    expect(screen.getByRole("heading", { name: "Proprietário" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Identificação" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Características" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Informações adicionais" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cadastrar veículo" }));

    expect(await screen.findByText("Selecione um proprietário válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe uma placa brasileira válida.")).toBeInTheDocument();
    expect(screen.getByText("Informe a marca.")).toBeInTheDocument();
    expect(createVehicleAction).not.toHaveBeenCalled();
  });

  it("formata a placa durante a digitação", async () => {
    const user = userEvent.setup();
    render(<VehicleForm clients={clients} />);

    const plate = screen.getByLabelText(/Placa/);
    await user.type(plate, "abc1234");
    expect(plate).toHaveValue("ABC-1234");

    await user.clear(plate);
    await user.type(plate, "abc1d23");
    expect(plate).toHaveValue("ABC1D23");
  });

  it("mantém o proprietário somente leitura durante a edição", () => {
    render(
      <VehicleForm
        clients={clients}
        defaultValues={{
          ownerId: clients[0].id,
          plate: "ABC-1234",
          brand: "Chevrolet",
          model: "Onix",
          manufactureYear: "2020",
          modelYear: "2021",
          color: "Branco",
          fuel: "flex",
          notes: "",
        }}
        vehicleId="17a58c52-6c6d-43a3-a5c4-e71a464b45f2"
      />,
    );

    expect(screen.getByLabelText(/Proprietário atual/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });
});

