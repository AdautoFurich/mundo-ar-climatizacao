import { render, screen } from "@testing-library/react";

import { VehicleList } from "./vehicle-list";

const vehicle = {
  id: "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
  ownerId: "87a32e64-7e85-49d5-b518-6a899b00ce21",
  ownerName: "Maria da Silva",
  plate: "ABC1234",
  brand: "Chevrolet",
  model: "Onix",
  manufactureYear: 2020,
  modelYear: 2021,
  active: true,
};

describe("listagem de veículos", () => {
  it("apresenta veículo e ações nas versões de tabela e cartão", () => {
    render(
      <VehicleList
        result={{
          vehicles: [vehicle],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }}
        search=""
        status="ativos"
      />,
    );

    expect(
      screen.getByRole("table", { name: "Veículos cadastrados na oficina" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ABC-1234")).toHaveLength(2);
    expect(screen.getAllByText("Chevrolet Onix")).toHaveLength(2);
    expect(screen.getAllByText("Maria da Silva")).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Ver detalhes de ABC-1234" }),
    ).toHaveLength(2);
  });

  it("diferencia estado vazio de resultado filtrado", () => {
    const emptyResult = {
      vehicles: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };
    const { rerender } = render(
      <VehicleList result={emptyResult} search="" status="ativos" />,
    );
    expect(
      screen.getByRole("heading", { name: "Nenhum veículo cadastrado" }),
    ).toBeInTheDocument();

    rerender(<VehicleList result={emptyResult} search="Onix" status="todos" />);
    expect(
      screen.getByRole("heading", { name: "Nenhum veículo encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toBeInTheDocument();
  });
});

