import {
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from "./types";

export type OrderStatusFilter = OrderStatus | "todas";

export type OrderListFilters = {
  page: number;
  search: string;
  status: OrderStatusFilter;
  responsibleId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

const ORDER_STATUSES = new Set<string>(ORDER_STATUS_VALUES);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CLOSED_STATUSES = new Set<OrderStatus>([
  "entregue",
  "reprovada",
  "cancelada",
]);

export function sanitizeOrderSearch(value: string) {
  return value
    .trim()
    .replace(/[,%_()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function parseOrderNumberSearch(value: string) {
  const match = value.match(/^os\s*#?\s*(\d+)$/i);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function validDate(value: unknown): string | null {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10) === value ? value : null;
}

export function parseOrderListFilters(input: {
  page?: unknown;
  search?: unknown;
  status?: unknown;
  responsibleId?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
}): OrderListFilters {
  const parsedPage =
    typeof input.page === "string" || typeof input.page === "number"
      ? Number(input.page)
      : 1;
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const search = sanitizeOrderSearch(
    typeof input.search === "string" ? input.search : "",
  );
  const status =
    input.status === "todas" ||
    (typeof input.status === "string" && ORDER_STATUSES.has(input.status))
      ? (input.status as OrderStatusFilter)
      : "todas";
  const responsibleId =
    typeof input.responsibleId === "string" &&
    UUID_PATTERN.test(input.responsibleId)
      ? input.responsibleId
      : null;
  let dateFrom = validDate(input.dateFrom);
  let dateTo = validDate(input.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    dateFrom = null;
    dateTo = null;
  }

  return { page, search, status, responsibleId, dateFrom, dateTo };
}

export function buildOrderDateRange(
  dateFrom: string | null,
  dateTo: string | null,
) {
  const from = dateFrom
    ? new Date(`${dateFrom}T00:00:00-03:00`).toISOString()
    : null;
  const until = dateTo
    ? new Date(
        new Date(`${dateTo}T00:00:00-03:00`).getTime() + 86_400_000,
      ).toISOString()
    : null;
  return { from, until };
}

export function isOrderOverdue(
  status: OrderStatus,
  expectedCompletionAt: string | null,
  now = new Date(),
) {
  if (!expectedCompletionAt || CLOSED_STATUSES.has(status)) return false;
  const expected = new Date(expectedCompletionAt);
  return !Number.isNaN(expected.getTime()) && expected < now;
}
