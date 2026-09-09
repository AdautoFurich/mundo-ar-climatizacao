import { describe, expect, it } from "vitest";

import {
  classifyOrderTransition,
  getNextNormalStatuses,
} from "./state-machine";

describe("máquina de estados da ordem", () => {
  it("permite somente o avanço normal esperado", () => {
    expect(getNextNormalStatuses("aberta")).toEqual([
      "em_diagnostico",
      "cancelada",
    ]);
    expect(getNextNormalStatuses("aguardando_aprovacao")).toEqual([
      "aprovada",
      "reprovada",
      "cancelada",
    ]);
    expect(getNextNormalStatuses("entregue")).toEqual([]);
  });

  it("classifica avanços, retrocessos e reaberturas", () => {
    expect(classifyOrderTransition("aberta", "em_diagnostico")).toBe("normal");
    expect(
      classifyOrderTransition("em_execucao", "aguardando_aprovacao"),
    ).toBe("retrocesso_administrativo");
    expect(classifyOrderTransition("entregue", "pronta_retirada")).toBe(
      "reabertura_administrativa",
    );
    expect(classifyOrderTransition("cancelada", "em_diagnostico")).toBe(
      "reabertura_administrativa",
    );
  });

  it("rejeita saltos e reaberturas sem destino coerente", () => {
    expect(classifyOrderTransition("aberta", "em_execucao")).toBe("invalida");
    expect(classifyOrderTransition("entregue", "em_diagnostico")).toBe(
      "invalida",
    );
    expect(classifyOrderTransition("reprovada", "em_execucao")).toBe(
      "invalida",
    );
  });
});
