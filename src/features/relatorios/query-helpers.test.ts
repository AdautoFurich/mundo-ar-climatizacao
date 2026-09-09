import { describe, expect, it } from "vitest";

import {
  aggregateMostPerformedServices,
  mostPerformedServicesReportUrl,
  ordersPeriodReportUrl,
  paginateMostPerformedServicesReport,
  paginateOrdersPeriodReport,
  parseMostPerformedServicesReportFilters,
  parseOrdersPeriodReportFilters,
  parseVehicleMaintenanceHistoryFilters,
  paginateVehicleMaintenanceHistory,
  vehicleMaintenanceHistoryUrl,
} from "./query-helpers";
import type {
  MostPerformedServiceReportRow,
  OrdersPeriodReportRow,
  VehicleMaintenanceHistoryRow,
} from "./types";

describe("filtros do relatório de ordens por período", () => {
  it("normaliza filtros válidos", () => {
    expect(parseOrdersPeriodReportFilters({
      page: "2",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      status: "entregue",
      client: "  Maria,_% Silva ",
      vehicle: " ABC-1D23 ",
      responsibleId: "10000000-0000-4000-8000-000000000001",
    })).toEqual({
      page: 2,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      status: "entregue",
      client: "Maria Silva",
      vehicle: "ABC-1D23",
      responsibleId: "10000000-0000-4000-8000-000000000001",
    });
  });

  it("usa padrões seguros para filtros inválidos", () => {
    expect(parseOrdersPeriodReportFilters({
      page: "-1",
      dateFrom: "2026-09-30",
      dateTo: "2026-09-01",
      status: "excluida",
      responsibleId: "usuario",
    })).toEqual({
      page: 1,
      dateFrom: null,
      dateTo: null,
      status: "todas",
      client: "",
      vehicle: "",
      responsibleId: null,
    });
  });

  it("preserva os filtros nos links de paginação", () => {
    const filters = parseOrdersPeriodReportFilters({
      dateFrom: "2026-09-01",
      status: "entregue",
      client: "Maria Silva",
    });
    expect(ordersPeriodReportUrl(filters, 3)).toBe(
      "/relatorios/ordens-periodo?de=2026-09-01&situacao=entregue&cliente=Maria+Silva&pagina=3",
    );
  });
});

describe("totais e paginação do relatório", () => {
  it("soma todas as ordens filtradas e pagina o resultado", () => {
    const base: OrdersPeriodReportRow = {
      id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      number: 1,
      entryAt: "2026-09-07T12:00:00.000Z",
      clientName: "Maria Silva",
      vehicleLabel: "Chevrolet Onix",
      vehiclePlate: "ABC1D23",
      status: "entregue",
      responsibleName: "Adauto Furich",
      total: 10000,
    };
    const orders = Array.from({ length: 17 }, (_, index) => ({
      ...base,
      id: `${index}`,
      number: index + 1,
      total: (index + 1) * 100,
    }));
    const result = paginateOrdersPeriodReport(orders, 2, 15);
    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(17);
    expect(result.totalValue).toBe(15300);
    expect(result.totalPages).toBe(2);
  });
});

describe("relatório de serviços mais realizados", () => {
  it("normaliza os filtros e preserva-os na paginação", () => {
    const filters = parseMostPerformedServicesReportFilters({
      page: "2",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      search: "  Higienização,_% ",
      category: "climatizacao",
    });

    expect(filters).toEqual({
      page: 2,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      search: "Higienização",
      category: "climatizacao",
    });
    expect(mostPerformedServicesReportUrl(filters, 3)).toBe(
      "/relatorios/servicos-mais-realizados?de=2026-09-01&ate=2026-09-30&busca=Higieniza%C3%A7%C3%A3o&categoria=climatizacao&pagina=3",
    );
  });

  it("calcula totais sobre todos os serviços antes de paginar", () => {
    const base: MostPerformedServiceReportRow = {
      serviceId: "10000000-0000-4000-8000-000000000001",
      serviceName: "Higienização",
      category: "climatizacao",
      ordersCount: 2,
      quantity: 3,
      totalValue: 30000,
    };
    const services = Array.from({ length: 16 }, (_, index) => ({
      ...base,
      serviceId: String(index),
      quantity: index + 1,
      totalValue: (index + 1) * 100,
    }));

    const result = paginateMostPerformedServicesReport(services, 2, 15);
    expect(result.services).toHaveLength(1);
    expect(result.totalServices).toBe(16);
    expect(result.totalOrders).toBe(32);
    expect(result.totalQuantity).toBe(136);
    expect(result.totalValue).toBe(13600);
    expect(result.totalPages).toBe(2);
  });

  it("agrupa por serviço, conta ordens distintas e ordena pela quantidade", () => {
    const services = aggregateMostPerformedServices(
      [
        { serviceId: "a", orderId: "os-1", quantity: 1, totalValue: 10000 },
        { serviceId: "a", orderId: "os-1", quantity: 2, totalValue: 20000 },
        { serviceId: "b", orderId: "os-2", quantity: 4, totalValue: 12000 },
      ],
      [
        { id: "a", name: "Higienização", category: "climatizacao" },
        { id: "b", name: "Diagnóstico elétrico", category: "diagnostico" },
      ],
      { category: "todas", search: "" },
    );

    expect(services).toEqual([
      {
        serviceId: "b",
        serviceName: "Diagnóstico elétrico",
        category: "diagnostico",
        ordersCount: 1,
        quantity: 4,
        totalValue: 12000,
      },
      {
        serviceId: "a",
        serviceName: "Higienização",
        category: "climatizacao",
        ordersCount: 1,
        quantity: 3,
        totalValue: 30000,
      },
    ]);
  });
});

describe("histórico de manutenção do veículo", () => {
  it("aceita somente veículo e datas válidos", () => {
    const filters = parseVehicleMaintenanceHistoryFilters({
      page: "2",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      vehicleId: "10000000-0000-4000-8000-000000000002",
    });

    expect(filters).toEqual({
      page: 2,
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      vehicleId: "10000000-0000-4000-8000-000000000002",
    });
    expect(vehicleMaintenanceHistoryUrl(filters, 3)).toBe(
      "/relatorios/historico-veiculos?veiculo=10000000-0000-4000-8000-000000000002&de=2026-01-01&ate=2026-12-31&pagina=3",
    );
  });

  it("calcula o resumo antes de paginar e usa a quilometragem mais recente", () => {
    const base: VehicleMaintenanceHistoryRow = {
      id: "os-1",
      number: 1,
      entryAt: "2026-09-07T12:00:00.000Z",
      deliveredAt: "2026-09-07T15:00:00.000Z",
      clientName: "Maria Silva",
      mileage: 50000,
      services: ["Higienização"],
      status: "entregue",
      totalValue: 10000,
    };
    const maintenances = Array.from({ length: 16 }, (_, index) => ({
      ...base,
      id: `os-${index + 1}`,
      number: index + 1,
      mileage: 50000 - index * 100,
      totalValue: (index + 1) * 100,
    }));

    const result = paginateVehicleMaintenanceHistory(maintenances, 2, 15);
    expect(result.maintenances).toHaveLength(1);
    expect(result.total).toBe(16);
    expect(result.totalValue).toBe(13600);
    expect(result.latestMileage).toBe(50000);
    expect(result.totalPages).toBe(2);
  });
});
