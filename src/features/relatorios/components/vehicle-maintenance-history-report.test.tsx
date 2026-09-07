import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  VehicleMaintenanceHistoryFilters,
  VehicleMaintenanceHistoryResult,
} from "../types";
import { VehicleMaintenanceHistoryReport } from "./vehicle-maintenance-history-report";

const emptyResult: VehicleMaintenanceHistoryResult = {
  maintenances: [],
  total: 0,
  totalValue: 0,
  latestMileage: null,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

const baseFilters: VehicleMaintenanceHistoryFilters = {
  page: 1,
  dateFrom: null,
  dateTo: null,
  vehicleId: null,
};

describe("histórico de manutenção do veículo", () => {
  it("solicita a seleção de um veículo antes da consulta", () => {
    render(
      <VehicleMaintenanceHistoryReport
        filters={baseFilters}
        result={emptyResult}
        vehicleLabel={null}
      />,
    );

    expect(screen.getByText("Selecione um veículo")).toBeInTheDocument();
  });

  it("informa quando o veículo não tem serviços executados", () => {
    render(
      <VehicleMaintenanceHistoryReport
        filters={{ ...baseFilters, vehicleId: "10000000-0000-4000-8000-000000000002" }}
        result={emptyResult}
        vehicleLabel="ABC1D23 · Chevrolet Onix"
      />,
    );

    expect(screen.getByText("Nenhuma manutenção encontrada")).toBeInTheDocument();
  });

  it("exibe serviços, quilometragem e totais do histórico", () => {
    const result: VehicleMaintenanceHistoryResult = {
      maintenances: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          number: 12,
          entryAt: "2026-09-07T12:00:00.000Z",
          deliveredAt: "2026-09-07T18:00:00.000Z",
          clientName: "Maria Silva",
          mileage: 84520,
          services: ["Higienização", "Recarga de gás"],
          status: "entregue",
          totalValue: 35000,
        },
      ],
      total: 1,
      totalValue: 35000,
      latestMileage: 84520,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    };

    render(
      <VehicleMaintenanceHistoryReport
        filters={{ ...baseFilters, vehicleId: "10000000-0000-4000-8000-000000000002" }}
        result={result}
        vehicleLabel="ABC1D23 · Chevrolet Onix"
      />,
    );

    expect(screen.getAllByText("Higienização")).toHaveLength(2);
    expect(screen.getAllByText("84.520 km")).toHaveLength(3);
    expect(screen.getByRole("table", { name: "Histórico de manutenção do veículo" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "OS #0012" })).toHaveLength(2);
  });
});
