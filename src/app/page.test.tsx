import { render, screen } from "@testing-library/react";

import Home from "./page";

describe("Dashboard inicial", () => {
  it("apresenta o resumo operacional e as ações principais", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Ritmo da oficina, agora" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nova ordem de serviço" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Novo cliente" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aguardando aprovação")).toBeInTheDocument();
  });
});
