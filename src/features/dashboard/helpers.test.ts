import { describe, expect, it } from "vitest";

import {
  buildDashboardAttentionItems,
  buildDashboardNextActions,
  buildDashboardStatusCounts,
  getDashboardDayRange,
} from "./helpers";
import type { DashboardOrder } from "./types";

const base: DashboardOrder = {
  id: "10000000-0000-4000-8000-000000000001",
  number: 1,
  status: "em_diagnostico",
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
};

describe("dados reais do dashboard", () => {
  it("gera o intervalo de hoje no fuso de São Paulo", () => {
    expect(getDashboardDayRange(new Date("2026-09-08T01:30:00.000Z"))).toEqual({
      from: "2026-09-07T03:00:00.000Z",
      until: "2026-09-08T03:00:00.000Z",
    });
  });

  it("conta os estados operacionais e atrasos sem valores fixos", () => {
    const orders: DashboardOrder[] = [
      base,
      { ...base, id: "2", status: "aguardando_aprovacao", overdue: true },
      { ...base, id: "3", status: "em_execucao" },
      { ...base, id: "4", status: "pronta_retirada" },
    ];
    expect(buildDashboardStatusCounts(orders)).toEqual({
      diagnosis: 1,
      awaitingApproval: 1,
      execution: 1,
      readyForPickup: 1,
      overdue: 1,
    });
  });

  it("prioriza ordens atrasadas e cria links reais", () => {
    const orders: DashboardOrder[] = [
      { ...base, id: "ready", number: 2, status: "pronta_retirada" },
      { ...base, id: "late", number: 3, overdue: true },
    ];
    const attention = buildDashboardAttentionItems(orders);
    const actions = buildDashboardNextActions(orders);

    expect(attention[0]).toMatchObject({ id: "late", overdue: true, href: "/ordens-servico/late" });
    expect(actions[0]).toMatchObject({ id: "late", kind: "overdue", href: "/ordens-servico/late" });
  });
});
