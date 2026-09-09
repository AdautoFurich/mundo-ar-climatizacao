import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Home from "./page";

vi.mock("@/features/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "00000000-0000-0000-0000-000000000001",
    name: "Adauto Furich",
    email: "admin@mundoar.test",
    role: "administrador",
    active: true,
  }),
}));

vi.mock("@/features/dashboard/queries", () => ({
  getDashboardData: vi.fn().mockResolvedValue({
    statusCounts: {
      diagnosis: 1,
      awaitingApproval: 2,
      execution: 1,
      readyForPickup: 0,
      overdue: 0,
    },
    recentOrders: [],
    daily: { opened: 1, delivered: 0, revenue: 0, averageTicket: 0 },
    attentionTotal: 0,
    attentionItems: [],
    nextActions: [],
  }),
}));

describe("Dashboard inicial", () => {
  it("apresenta o resumo operacional e a sessão do usuário", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Visão geral" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nova ordem de serviço" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Novo cliente" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aguardando aprovação")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ordens recentes" })).toBeInTheDocument();
    expect(screen.getByText("Próximas ações")).toBeInTheDocument();
    expect(screen.getByText("Ticket médio de hoje")).toBeInTheDocument();
    expect(screen.getByText("Adauto Furich")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sair" })).toHaveLength(2);
  });
});
