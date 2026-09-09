import type { ClientFormInput } from "./schemas";

export type ClientStatusFilter = "ativos" | "inativos" | "todos";

export type ClientSummary = {
  id: string;
  name: string;
  cpf: string;
  primaryPhone: string;
  alternatePhone: string | null;
  email: string | null;
  city: string;
  state: string;
  active: boolean;
};

export type ClientDetails = ClientSummary & {
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientListResult = {
  clients: ClientSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ClientActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_CLIENT_ACTION_STATE: ClientActionState = {
  status: "idle",
};

export type ClientFormValues = ClientFormInput;
