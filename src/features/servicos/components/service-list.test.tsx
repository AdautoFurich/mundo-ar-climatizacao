import { render, screen } from "@testing-library/react";

import type { ServiceListResult } from "../types";
import { ServiceList } from "./service-list";

const result: ServiceListResult = {
  services: [
    {
      id: "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
      name: "Higienização do ar-condicionado",
      category: "climatizacao",
      description: "Limpeza do sistema de ventilação.",
      basePrice: 180.5,
      active: true,
    },
    {
      id: "87a32e64-7e85-49d5-b518-6a899b00ce21",
      name: "Diagnóstico elétrico",
      category: "diagnostico",
      description: null,
      basePrice: null,
      active: false,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe("listagem de serviços", () => {
  it("apresenta categorias, valores e situação", () => {
    render(
      <ServiceList
        canManage
        category="todas"
        result={result}
        search=""
        status="todos"
      />,
    );

    expect(screen.getAllByText("Higienização do ar-condicionado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Climatização").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*180,50/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("A definir").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Editar/)).not.toHaveLength(0);
  });

  it("não oferece edição ao atendente", () => {
    render(
      <ServiceList
        canManage={false}
        category="todas"
        result={result}
        search=""
        status="todos"
      />,
    );

    expect(screen.queryByLabelText(/Editar/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Ver detalhes/)).not.toHaveLength(0);
  });

  it("orienta quando o catálogo ainda está vazio", () => {
    render(
      <ServiceList
        canManage
        category="todas"
        result={{ ...result, services: [], total: 0 }}
        search=""
        status="ativos"
      />,
    );

    expect(screen.getByText("Nenhum serviço cadastrado")).toBeVisible();
  });
});
