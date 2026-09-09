import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/features/auth/types";

import { AppShell } from "./app-shell";

vi.mock("@/features/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

const administrator: CurrentUser = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Adauto Furich",
  email: "adauto@example.com",
  role: "administrador",
  active: true,
};

const attendant: CurrentUser = {
  ...administrator,
  id: "10000000-0000-4000-8000-000000000002",
  name: "Maria Atendente",
  role: "atendente",
};

function renderShell(currentPath: string, user = administrator) {
  return render(
    <AppShell
      currentPath={currentPath}
      description="Descrição da página"
      title="Título da página"
      user={user}
    >
      <p>Conteúdo</p>
    </AppShell>,
  );
}

describe("navegação do sistema", () => {
  it("exibe as seções fixas nos menus desktop e móvel", () => {
    const { container } = renderShell("/");

    expect(screen.getAllByRole("link", { name: "Visão geral" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Ordens de serviço" })).toHaveLength(2);
    expect(screen.getAllByText("Cadastros")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Relatórios" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Usuários" })).toHaveLength(2);

    expect(screen.queryByText("Diagnósticos")).not.toBeInTheDocument();
    expect(screen.queryByText("Agenda")).not.toBeInTheDocument();
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
    expect(screen.queryByText("Estoque")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-registration-navigation]")).toHaveLength(0);
  });

  it("mantém os três cadastros sempre visíveis em sua própria seção", () => {
    renderShell("/");
    const groups = screen.getAllByRole("navigation", { name: "Cadastros" });

    for (const group of groups) {
      expect(within(group).getByRole("link", { name: "Clientes" })).toHaveAttribute(
        "href",
        "/clientes",
      );
      expect(within(group).getByRole("link", { name: "Veículos" })).toHaveAttribute(
        "href",
        "/veiculos",
      );
      expect(within(group).getByRole("link", { name: "Serviços" })).toHaveAttribute(
        "href",
        "/servicos",
      );
    }
  });

  it("marca o cadastro atual também em suas rotas internas", () => {
    renderShell("/veiculos/novo");
    const groups = screen.getAllByRole("navigation", { name: "Cadastros" });

    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(within(group).getByRole("link", { name: "Veículos" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  it("mantém Relatórios ativo em todas as páginas de relatório", () => {
    renderShell("/relatorios/historico-veiculos");

    for (const link of screen.getAllByRole("link", { name: "Relatórios" })) {
      expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  it("oculta a área administrativa para o atendente", () => {
    renderShell("/", attendant);

    expect(screen.queryByRole("link", { name: "Usuários" })).not.toBeInTheDocument();
    expect(screen.queryByText("Administração")).not.toBeInTheDocument();
  });
});
