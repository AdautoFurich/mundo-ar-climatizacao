import { describe, expect, it } from "vitest";

import {
  buildOrderDateRange,
  isOrderOverdue,
  parseOrderListFilters,
  parseOrderNumberSearch,
  sanitizeOrderSearch,
} from "./query-helpers";

describe("parâmetros da listagem de ordens", () => {
  it("normaliza página, busca e filtros válidos", () => {
    expect(
      parseOrderListFilters({
        page: "3",
        search: "  OS   #0012,_%  ",
        status: "em_diagnostico",
        responsibleId: "10000000-0000-4000-8000-000000000001",
        dateFrom: "2026-09-01",
        dateTo: "2026-09-30",
      }),
    ).toEqual({
      page: 3,
      search: "OS #0012",
      status: "em_diagnostico",
      responsibleId: "10000000-0000-4000-8000-000000000001",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
    });
  });

  it("usa padrões seguros para parâmetros inválidos", () => {
    expect(
      parseOrderListFilters({
        page: "-2",
        status: "apagada",
        responsibleId: "responsavel",
        dateFrom: "2026-02-30",
        dateTo: "ontem",
      }),
    ).toEqual({
      page: 1,
      search: "",
      status: "todas",
      responsibleId: null,
      dateFrom: null,
      dateTo: null,
    });
  });

  it("remove operadores da busca e limita seu tamanho", () => {
    expect(sanitizeOrderSearch("  Maria,_% (Silva)  ")).toBe("Maria Silva");
    expect(sanitizeOrderSearch("a".repeat(120))).toHaveLength(80);
  });

  it("reconhece pesquisas por número de OS", () => {
    expect(parseOrderNumberSearch("OS #0012")).toBe(12);
    expect(parseOrderNumberSearch("os 98")).toBe(98);
    expect(parseOrderNumberSearch("Cliente 12")).toBeNull();
    expect(parseOrderNumberSearch("OS #0")).toBeNull();
  });

  it("constrói intervalo inclusivo no fuso da oficina", () => {
    expect(buildOrderDateRange("2026-09-01", "2026-09-30")).toEqual({
      from: "2026-09-01T03:00:00.000Z",
      until: "2026-10-01T03:00:00.000Z",
    });
    expect(buildOrderDateRange(null, null)).toEqual({
      from: null,
      until: null,
    });
  });
});

describe("identificação de atraso", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("marca ordem aberta com previsão vencida", () => {
    expect(isOrderOverdue("em_execucao", "2026-09-09T18:00:00.000Z", now)).toBe(
      true,
    );
  });

  it("não marca previsão futura, ausente ou ordem encerrada", () => {
    expect(isOrderOverdue("aberta", "2026-09-11T18:00:00.000Z", now)).toBe(false);
    expect(isOrderOverdue("aberta", null, now)).toBe(false);
    expect(isOrderOverdue("entregue", "2026-09-09T18:00:00.000Z", now)).toBe(
      false,
    );
    expect(isOrderOverdue("cancelada", "2026-09-09T18:00:00.000Z", now)).toBe(
      false,
    );
  });
});
