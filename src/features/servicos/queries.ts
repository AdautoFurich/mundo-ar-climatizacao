import "server-only";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { serviceIdSchema } from "./schemas";
import type {
  ServiceCategoryFilter,
  ServiceDetails,
  ServiceListResult,
  ServiceStatusFilter,
  ServiceSummary,
} from "./types";

type ServiceRow = Database["public"]["Tables"]["servicos"]["Row"];

const SERVICE_FIELDS =
  "id, nome, categoria, descricao, valor_base, ativo, criado_em, atualizado_em";

function safeSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[,%_()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function toSummary(row: ServiceRow): ServiceSummary {
  return {
    id: row.id,
    name: row.nome,
    category: row.categoria,
    description: row.descricao,
    basePrice: row.valor_base,
    active: row.ativo,
  };
}

function toDetails(row: ServiceRow): ServiceDetails {
  return {
    ...toSummary(row),
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  };
}

export async function listServices({
  page = 1,
  search = "",
  status = "ativos",
  category = "todas",
}: {
  page?: number;
  search?: string;
  status?: ServiceStatusFilter;
  category?: ServiceCategoryFilter;
}): Promise<ServiceListResult> {
  await requirePermission("servicos:consultar");

  const pageSize = 10;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * pageSize;
  const supabase = await createClient();
  let query = supabase
    .from("servicos")
    .select(SERVICE_FIELDS, { count: "exact" })
    .order("nome")
    .range(from, from + pageSize - 1);

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativos");
  }
  if (category !== "todas") {
    query = query.eq("categoria", category);
  }

  const term = safeSearchTerm(search);
  if (term) {
    query = query.or(`nome.ilike.%${term}%,descricao.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error("Não foi possível carregar os serviços.");

  const rows = (data ?? []) as ServiceRow[];
  const total = count ?? 0;
  return {
    services: rows.map(toSummary),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getServiceById(id: string): Promise<ServiceDetails | null> {
  await requirePermission("servicos:consultar");
  if (!serviceIdSchema.safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .select(SERVICE_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar o serviço.");
  return data ? toDetails(data as ServiceRow) : null;
}
