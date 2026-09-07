import type { OrderStatus } from "@/features/ordens-servico/types";

export type DashboardOrder = {
  id: string;
  number: number;
  status: OrderStatus;
  clientName: string;
  clientPhone: string;
  vehicleLabel: string;
  vehiclePlate: string;
  vehicleYear: string;
  responsibleName: string;
  entryAt: string;
  expectedCompletionAt: string | null;
  authorizedTotal: number;
  overdue: boolean;
};

export type DashboardAttentionItem = {
  id: string;
  title: string;
  detail: string;
  action: string;
  href: string;
  overdue: boolean;
};

export type DashboardNextAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: "approval" | "diagnosis" | "execution" | "delivery" | "overdue";
};

export type DashboardData = {
  statusCounts: {
    diagnosis: number;
    awaitingApproval: number;
    execution: number;
    readyForPickup: number;
    overdue: number;
  };
  recentOrders: DashboardOrder[];
  daily: {
    opened: number;
    delivered: number;
    revenue: number;
    averageTicket: number;
  };
  attentionTotal: number;
  attentionItems: DashboardAttentionItem[];
  nextActions: DashboardNextAction[];
};
