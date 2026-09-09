import type { VehicleFormInput } from "./schemas";

export type VehicleStatusFilter = "ativos" | "inativos" | "todos";

export type ActiveClientOption = {
  id: string;
  name: string;
  cpf: string;
};

export type VehicleSummary = {
  id: string;
  ownerId: string;
  ownerName: string;
  plate: string;
  brand: string;
  model: string;
  manufactureYear: number;
  modelYear: number;
  active: boolean;
};

export type VehicleDetails = VehicleSummary & {
  color: string | null;
  fuel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleOwnerHistory = {
  id: string;
  previousOwnerId: string;
  previousOwnerName: string;
  newOwnerId: string;
  newOwnerName: string;
  changedByName: string;
  transferredAt: string;
};

export type VehicleListResult = {
  vehicles: VehicleSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type VehicleActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_VEHICLE_ACTION_STATE: VehicleActionState = {
  status: "idle",
};

export type VehicleFormValues = VehicleFormInput;
