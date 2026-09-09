import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MostPerformedServicesReport } from "./most-performed-services-report";
import type {
  MostPerformedServicesReportFilters,
  MostPerformedServicesReportResult,
} from "../types";

const filters: MostPerformedServicesReportFilters = {
  page: 1,
  dateFrom: null,
  dateTo: null,
  search: "",
  category: "todas",
};

describe("relatório de serviços mais realizados", () => {
  it("exibe o ranking e os totais calculados", () => {
    const result: MostPerformedServicesReportResult = {
      services: [
        {
          serviceId: "10000000-0000-4000-8000-000000000001",
          serviceName: "Higienização do ar-condicionado",
          category: "climatizacao",
          ordersCount: 3,
          quantity: 4,
          totalValue: 80000,
        },
      ],
      totalServices: 1,
      totalOrders: 3,
      totalQuantity: 4,
      totalValue: 80000,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    };

    render(<MostPerformedServicesReport filters={filters} result={result} />);

    expect(screen.getAllByText("Higienização do ar-condicionado")).toHaveLength(2);
    expect(screen.getAllByText("R$ 800,00")).toHaveLength(3);
    expect(screen.getByRole("table", { name: "Serviços mais realizados" })).toBeInTheDocument();
  });

  it("orienta o usuário quando não existem execuções", () => {
    const result: MostPerformedServicesReportResult = {
      services: [],
      totalServices: 0,
      totalOrders: 0,
      totalQuantity: 0,
      totalValue: 0,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    };

    render(<MostPerformedServicesReport filters={filters} result={result} />);

    expect(screen.getByText("Nenhum serviço executado encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute(
      "href",
      "/relatorios/servicos-mais-realizados",
    );
  });
});
