import "server-only";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { vehicleIdSchema } from "./schemas";
import type {
  ActiveClientOption,
  VehicleDetails,
  VehicleListResult,
  VehicleOwnerHistory,
  VehicleStatusFilter,
  VehicleSummary,
} from "./types";

type VehicleRow = Database["public"]["Tables"]["veiculos"]["Row"];
type HistoryRow =
  Database["public"]["Tables"]["historico_proprietarios_veiculos"]["Row"];

const VEHICLE_FIELDS =
  "id, cliente_id, placa, marca, modelo, ano_fabricacao, ano_modelo, cor, combustivel, observacoes, ativo, criado_em, atualizado_em";

function safeSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[,%_()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function toSummary(row: VehicleRow, ownerName: string): VehicleSummary {
  return {
    id: row.id,
    ownerId: row.cliente_id,
    ownerName,
    plate: row.placa,
    brand: row.marca,
    model: row.modelo,
    manufactureYear: row.ano_fabricacao,
    modelYear: row.ano_modelo,
    active: row.ativo,
  };
}

function toDetails(row: VehicleRow, ownerName: string): VehicleDetails {
  return {
    ...toSummary(row, ownerName),
    color: row.cor,
    fuel: row.combustivel,
    notes: row.observacoes,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  };
}

async function ownerNames(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .in("id", [...new Set(ids)]);

  if (error) throw new Error("Não foi possível carregar os proprietários.");
  return new Map((data ?? []).map((client) => [client.id, client.nome]));
}

export async function listVehicles({
  page = 1,
  search = "",
  status = "ativos",
}: {
  page?: number;
  search?: string;
  status?: VehicleStatusFilter;
}): Promise<VehicleListResult> {
  await requirePermission("veiculos:consultar");

  const pageSize = 10;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * pageSize;
  const supabase = await createClient();
  let query = supabase
    .from("veiculos")
    .select(VEHICLE_FIELDS, { count: "exact" })
    .order("marca")
    .order("modelo")
    .range(from, from + pageSize - 1);

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativos");
  }

  const term = safeSearchTerm(search);
  if (term) {
    const normalizedPlate = term.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const { data: matchingOwners, error: ownerSearchError } = await supabase
      .from("clientes")
      .select("id")
      .ilike("nome", `%${term}%`)
      .limit(100);

    if (ownerSearchError) throw new Error("Não foi possível pesquisar veículos.");

    const filters = [
      `marca.ilike.%${term}%`,
      `modelo.ilike.%${term}%`,
    ];
    if (normalizedPlate) filters.push(`placa.ilike.%${normalizedPlate}%`);
    if (matchingOwners?.length) {
      filters.push(`cliente_id.in.(${matchingOwners.map(({ id }) => id).join(",")})`);
    }
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query;
  if (error) throw new Error("Não foi possível carregar os veículos.");

  const rows = (data ?? []) as VehicleRow[];
  const names = await ownerNames(rows.map((row) => row.cliente_id));
  const total = count ?? 0;

  return {
    vehicles: rows.map((row) =>
      toSummary(row, names.get(row.cliente_id) ?? "Cliente não encontrado"),
    ),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getVehicleById(id: string): Promise<VehicleDetails | null> {
  await requirePermission("veiculos:consultar");
  if (!vehicleIdSchema.safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select(VEHICLE_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar o veículo.");
  if (!data) return null;

  const row = data as VehicleRow;
  const names = await ownerNames([row.cliente_id]);
  return toDetails(row, names.get(row.cliente_id) ?? "Cliente não encontrado");
}

export async function listActiveClientOptions(
  includeClientId?: string,
): Promise<ActiveClientOption[]> {
  await requirePermission("veiculos:gerenciar");
  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("id, nome, cpf");

  if (includeClientId && vehicleIdSchema.safeParse(includeClientId).success) {
    query = query.or(`ativo.eq.true,id.eq.${includeClientId}`);
  } else {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query
    .order("nome")
    .limit(500);

  if (error) throw new Error("Não foi possível carregar os clientes.");
  return (data ?? []).map((client) => ({
    id: client.id,
    name: client.nome,
    cpf: client.cpf,
  }));
}

export async function listVehicleOwnerHistory(
  vehicleId: string,
): Promise<VehicleOwnerHistory[]> {
  await requirePermission("veiculos:consultar");
  if (!vehicleIdSchema.safeParse(vehicleId).success) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("historico_proprietarios_veiculos")
    .select(
      "id, veiculo_id, cliente_anterior_id, cliente_novo_id, usuario_id, transferido_em",
    )
    .eq("veiculo_id", vehicleId)
    .order("transferido_em", { ascending: false });

  if (error) throw new Error("Não foi possível carregar o histórico do veículo.");
  const rows = (data ?? []) as HistoryRow[];
  if (rows.length === 0) return [];

  const clientIds = rows.flatMap((row) => [
    row.cliente_anterior_id,
    row.cliente_novo_id,
  ]);
  const userIds = [...new Set(rows.map((row) => row.usuario_id))];
  const [names, usersResult] = await Promise.all([
    ownerNames(clientIds),
    supabase.from("perfis_usuarios").select("id, nome").in("id", userIds),
  ]);

  if (usersResult.error) {
    throw new Error("Não foi possível carregar os responsáveis pelas transferências.");
  }
  const userNames = new Map(
    (usersResult.data ?? []).map((user) => [user.id, user.nome]),
  );

  return rows.map((row) => ({
    id: row.id,
    previousOwnerId: row.cliente_anterior_id,
    previousOwnerName:
      names.get(row.cliente_anterior_id) ?? "Cliente não encontrado",
    newOwnerId: row.cliente_novo_id,
    newOwnerName: names.get(row.cliente_novo_id) ?? "Cliente não encontrado",
    changedByName: userNames.get(row.usuario_id) ?? "Usuário não encontrado",
    transferredAt: row.transferido_em,
  }));
}

export async function listVehiclesByOwner(
  ownerId: string,
): Promise<VehicleSummary[]> {
  await requirePermission("veiculos:consultar");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select(VEHICLE_FIELDS)
    .eq("cliente_id", ownerId)
    .order("ativo", { ascending: false })
    .order("marca")
    .limit(100);

  if (error) throw new Error("Não foi possível carregar os veículos do cliente.");
  const rows = (data ?? []) as VehicleRow[];
  const names = await ownerNames([ownerId]);
  const ownerName = names.get(ownerId) ?? "Cliente não encontrado";
  return rows.map((row) => toSummary(row, ownerName));
}
