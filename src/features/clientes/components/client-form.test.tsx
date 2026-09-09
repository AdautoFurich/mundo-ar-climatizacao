import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ClientForm } from "./client-form";

const { createClientAction, updateClientAction } = vi.hoisted(() => ({
  createClientAction: vi.fn(),
  updateClientAction: vi.fn(),
}));

vi.mock("../actions", () => ({
  createClientAction,
  updateClientAction,
}));

describe("formulário de clientes", () => {
  it("apresenta as quatro seções e valida os campos obrigatórios", async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    expect(screen.getByRole("heading", { name: "Dados pessoais" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contato" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Endereço" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Informações adicionais" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    expect(await screen.findByText("Informe o nome completo.")).toBeInTheDocument();
    expect(screen.getByText("Informe um CPF com 11 dígitos.")).toBeInTheDocument();
    expect(createClientAction).not.toHaveBeenCalled();
  });

  it("aplica máscaras visuais sem impedir a digitação", async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const cpf = screen.getByLabelText(/CPF/);
    const phone = screen.getByLabelText(/Telefone principal/);
    const zipCode = screen.getByLabelText(/CEP/);

    await user.type(cpf, "52998224725");
    await user.type(phone, "44999123456");
    await user.type(zipCode, "87010000");

    expect(cpf).toHaveValue("529.982.247-25");
    expect(phone).toHaveValue("(44) 99912-3456");
    expect(zipCode).toHaveValue("87010-000");
  });
});
