import { render, screen } from "@testing-library/react";

import type { OrderListFilters } from "../query-helpers";
import type { ServiceOrderListResult } from "../types";
import { OrderList } from "./order-list";

const filters: OrderListFilters = {
  page: 1,
  search: "",
  status: "todas",
  responsibleId: null,
  dateFrom: null,
  dateTo: null,
};

const result: ServiceOrderListResult = {
  orders: [
    {
      id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      number: 18,
      status: "em_diagnostico",
      clientId: "87a32e64-7e85-49d5-b518-6a899b00ce21",
      clientName: "Maria da Silva",
      vehicleId: "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
      vehiclePlate: "ABC1D23",
      vehicleLabel: "Chevrolet Onix",
      responsibleId: "d8bb1600-93c0-4ba3-b16f-6ef91fb1d317",
      responsibleName: "Adauto Furich",
      entryAt: "2026-09-05T11:30:00.000Z",
      expectedCompletionAt: "2026-09-05T18:00:00.000Z",
      authorizedTotal: 48750,
      updatedAt: "2026-09-05T11:30:00.000Z",
      overdue: true,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe("listagem de ordens de serviço", () => {
  it("apresenta os dados na tabela e nos cartões responsivos", () => {
    render(<OrderList filters={filters} result={result} />);

    expect(
      screen.getByRole("table", { name: "Ordens de serviço da oficina" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("OS #0018")).toHaveLength(2);
    expect(screen.getAllByText("Chevrolet Onix")).toHaveLength(2);
    expect(screen.getAllByText("Maria da Silva")).toHaveLength(2);
    expect(screen.getAllByText("Em diagnóstico")).toHaveLength(2);
    expect(screen.getAllByText(/487,50/)).toHaveLength(2);
    expect(screen.getAllByText("Atrasada")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "OS #0018" })).toHaveLength(2);
  });

  it("diferencia ausência de ordens de um resultado filtrado vazio", () => {
    const emptyResult = { ...result, orders: [], total: 0 };
    const { rerender } = render(
      <OrderList filters={filters} result={emptyResult} />,
    );

    expect(
      screen.getByRole("heading", { name: "Nenhuma ordem de serviço aberta" }),
    ).toBeInTheDocument();

    rerender(
      <OrderList
        filters={{ ...filters, search: "Onix" }}
        result={emptyResult}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Nenhuma ordem encontrada" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toBeInTheDocument();
  });
});
