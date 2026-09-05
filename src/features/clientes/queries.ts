import "server-only";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { clientIdSchema, onlyDigits } from "./schemas";
import type {
  ClientDetails,
  ClientListResult,
  ClientStatusFilter,
  ClientSummary,
} from "./types";

type ClientRow = Database["public"]["Tables"]["clientes"]["Row"];

const CLIENT_FIELDS =
  "id, nome, cpf, telefone_principal, telefone_alternativo, email, cep, logradouro, numero, complemento, bairro, cidade, estado, observacoes, ativo, criado_em, atualizado_em";

function toSummary(row: ClientRow): ClientSummary {
  return {
    id: row.id,
    name: row.nome,
    cpf: row.cpf,
    primaryPhone: row.telefone_principal,
    alternatePhone: row.telefone_alternativo,
    email: row.email,
    city: row.cidade,
    state: row.estado,
    active: row.ativo,
  };
}

function toDetails(row: ClientRow): ClientDetails {
  return {
    ...toSummary(row),
    zipCode: row.cep,
    street: row.logradouro,
    number: row.numero,
    complement: row.complemento,
    neighborhood: row.bairro,
    notes: row.observacoes,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  };
}

function safeSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[,%_()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export async function listClients({
  page = 1,
  search = "",
  status = "ativos",
}: {
  page?: number;
  search?: string;
  status?: ClientStatusFilter;
}): Promise<ClientListResult> {
  await requirePermission("clientes:consultar");

  const pageSize = 10;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * pageSize;
  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select(CLIENT_FIELDS, { count: "exact" })
    .order("nome")
    .range(from, from + pageSize - 1);

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativos");
  }

  const term = safeSearchTerm(search);
  if (term) {
    const digits = onlyDigits(term);
    const filters = [
      `nome.ilike.%${term}%`,
      `email.ilike.%${term.toLowerCase()}%`,
    ];

    if (digits) {
      filters.push(
        `cpf.ilike.%${digits}%`,
        `telefone_principal.ilike.%${digits}%`,
        `telefone_alternativo.ilike.%${digits}%`,
      );
    }

    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query;
  if (error) throw new Error("Não foi possível carregar os clientes.");

  const total = count ?? 0;
  return {
    clients: (data as ClientRow[]).map(toSummary),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getClientById(id: string): Promise<ClientDetails | null> {
  await requirePermission("clientes:consultar");
  if (!clientIdSchema.safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select(CLIENT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar o cliente.");
  return data ? toDetails(data as ClientRow) : null;
}
