import { render, screen } from "@testing-library/react";

import { ClientList } from "./client-list";

const client = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Maria da Silva",
  cpf: "52998224725",
  primaryPhone: "44999123456",
  alternatePhone: null,
  email: "maria@exemplo.com.br",
  city: "Maringá",
  state: "PR",
  active: true,
};

describe("listagem de clientes", () => {
  it("apresenta cliente e ações nas versões de tabela e cartão", () => {
    render(
      <ClientList
        result={{
          clients: [client],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }}
        search=""
        status="ativos"
      />,
    );

    expect(screen.getByRole("table", { name: "Clientes cadastrados na oficina" })).toBeInTheDocument();
    expect(screen.getAllByText("Maria da Silva")).toHaveLength(2);
    expect(screen.getAllByText("(44) 99912-3456")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Ver detalhes de Maria da Silva" })).toHaveLength(2);
  });

  it("diferencia o estado vazio do resultado filtrado", () => {
    const { rerender } = render(
      <ClientList
        result={{ clients: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }}
        search=""
        status="ativos"
      />,
    );
    expect(screen.getByRole("heading", { name: "Nenhum cliente cadastrado" })).toBeInTheDocument();

    rerender(
      <ClientList
        result={{ clients: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }}
        search="Maria"
        status="todos"
      />,
    );
    expect(screen.getByRole("heading", { name: "Nenhum cliente encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toBeInTheDocument();
  });
});
