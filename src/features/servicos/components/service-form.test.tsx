import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ServiceForm } from "./service-form";

const { createServiceAction, updateServiceAction } = vi.hoisted(() => ({
  createServiceAction: vi.fn(),
  updateServiceAction: vi.fn(),
}));

vi.mock("../actions", () => ({ createServiceAction, updateServiceAction }));

describe("formulário de serviço", () => {
  beforeEach(() => {
    createServiceAction.mockReset();
    updateServiceAction.mockReset();
  });

  it("apresenta os campos e as categorias do catálogo", () => {
    render(<ServiceForm />);

    expect(screen.getByLabelText(/Nome do serviço/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categoria/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor-base/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(6);
  });

  it("valida os campos obrigatórios antes de enviar", async () => {
    const user = userEvent.setup();
    render(<ServiceForm />);

    await user.click(screen.getByRole("button", { name: "Cadastrar serviço" }));

    expect(await screen.findByText("Informe o nome do serviço.")).toBeVisible();
    expect(screen.getByText("Selecione uma categoria válida.")).toBeVisible();
    expect(createServiceAction).not.toHaveBeenCalled();
  });

  it("carrega os valores existentes na edição", () => {
    render(
      <ServiceForm
        defaultValues={{
          name: "Carga de gás",
          category: "climatizacao",
          description: "Recarga conforme especificação.",
          basePrice: "250,00",
        }}
        serviceId="17a58c52-6c6d-43a3-a5c4-e71a464b45f2"
      />,
    );

    expect(screen.getByLabelText(/Nome do serviço/)).toHaveValue("Carga de gás");
    expect(screen.getByLabelText(/Valor-base/)).toHaveValue("250,00");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeVisible();
  });
});
