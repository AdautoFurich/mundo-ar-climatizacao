import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DashboardData } from "../types";
import { DashboardOverview } from "./dashboard-overview";

const data: DashboardData = {
  statusCounts: {
    diagnosis: 1,
    awaitingApproval: 2,
    execution: 3,
    readyForPickup: 4,
    overdue: 1,
  },
  recentOrders: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      number: 12,
      status: "em_execucao",
      clientName: "Maria Silva",
      clientPhone: "(44) 99999-0000",
      vehicleLabel: "Chevrolet Onix",
      vehiclePlate: "ABC1D23",
      vehicleYear: "2020/2021",
      responsibleName: "Adauto Furich",
      entryAt: "2026-09-07T12:00:00.000Z",
      expectedCompletionAt: "2026-09-08T18:00:00.000Z",
      authorizedTotal: 20000,
      overdue: false,
    },
  ],
  daily: {
    opened: 2,
    delivered: 1,
    revenue: 35000,
    averageTicket: 35000,
  },
  attentionTotal: 0,
  attentionItems: [],
  nextActions: [],
};

describe("visão geral com dados reais", () => {
  it("exibe os indicadores e a ordem recebidos da consulta", () => {
    render(<DashboardOverview data={data} />);

    expect(screen.getByText("OS #0012")).toBeInTheDocument();
    expect(screen.getByText("Chevrolet Onix")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 350,00")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Abrir OS #0012" })).toHaveAttribute(
      "href",
      "/ordens-servico/10000000-0000-4000-8000-000000000001",
    );
    expect(screen.queryByText(/desde ontem/i)).not.toBeInTheDocument();
  });

  it("mostra estados vazios em vez de informações demonstrativas", () => {
    render(
      <DashboardOverview
        data={{ ...data, recentOrders: [], attentionItems: [], nextActions: [] }}
      />,
    );

    expect(screen.getByText("Nenhuma ordem cadastrada")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma pendência urgente no momento.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma ação operacional pendente.")).toBeInTheDocument();
  });
});
