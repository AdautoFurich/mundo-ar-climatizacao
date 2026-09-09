import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parseOrdersPeriodReportFilters } from "../query-helpers";
import type { OrdersPeriodReportResult } from "../types";
import { OrdersPeriodReport } from "./orders-period-report";

const filters = parseOrdersPeriodReportFilters({
  dateFrom: "2026-09-01",
  dateTo: "2026-09-30",
});

const result: OrdersPeriodReportResult = {
  orders: [
    {
      id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      number: 18,
      entryAt: "2026-09-07T12:00:00.000Z",
      clientName: "Maria da Silva",
      vehicleLabel: "Chevrolet Onix",
      vehiclePlate: "ABC1D23",
      status: "entregue",
      responsibleName: "Adauto Furich",
      total: 48750,
    },
  ],
  total: 1,
  totalValue: 48750,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

describe("relatório de ordens por período", () => {
  it("mostra totais e os dados operacionais das ordens", () => {
    render(<OrdersPeriodReport filters={filters} result={result} />);

    expect(screen.getByText("1 ordem encontrada")).toBeInTheDocument();
    expect(screen.getAllByText(/487,50/).length).toBeGreaterThan(0);
    expect(screen.getByRole("table", { name: "Ordens de serviço por período" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "OS #0018" })[0]).toHaveAttribute(
      "href",
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a",
    );
    expect(screen.getAllByText("Maria da Silva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ABC1D23").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Adauto Furich").length).toBeGreaterThan(0);
  });

  it("orienta o usuário quando o filtro não encontra resultados", () => {
    render(
      <OrdersPeriodReport
        filters={filters}
        result={{ ...result, orders: [], total: 0, totalValue: 0 }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nenhuma ordem encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute(
      "href",
      "/relatorios/ordens-periodo",
    );
  });
});
