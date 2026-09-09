import type {
  ServiceCategory,
  ServiceFormInput,
} from "./schemas";

export type ServiceStatusFilter = "ativos" | "inativos" | "todos";
export type ServiceCategoryFilter = ServiceCategory | "todas";

export type ServiceSummary = {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  basePrice: number | null;
  active: boolean;
};

export type ServiceDetails = ServiceSummary & {
  createdAt: string;
  updatedAt: string;
};

export type ServiceListResult = {
  services: ServiceSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ServiceActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_SERVICE_ACTION_STATE: ServiceActionState = {
  status: "idle",
};

export type ServiceFormValues = ServiceFormInput;
