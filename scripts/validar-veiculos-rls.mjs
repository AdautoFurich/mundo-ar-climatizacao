import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error("Configure o arquivo .env.local antes de validar o RLS.");
}

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const adminApi = createClient(url, secretKey, options);
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = "MundoAr!Veiculos2026#";
const createdUserIds = [];
const createdClientIds = [];
const createdVehicleIds = [];

function validCpf(seed) {
  const base = seed.replace(/\D/g, "").slice(-9).padStart(9, "1");
  const digit = (partial) => {
    const sum = partial
      .split("")
      .reduce(
        (total, value, index) =>
          total + Number(value) * (partial.length + 1 - index),
        0,
      );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const first = `${base}${digit(base)}`;
  return `${first}${digit(first)}`;
}

async function createTestUser(label, role) {
  const email = `veiculos-${label}-${runId}@mundoar.invalid`;
  const { data, error } = await adminApi.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: `Teste ${label}`, perfil: role },
  });

  if (error || !data.user) throw error ?? new Error("Usuário não criado.");
  createdUserIds.push(data.user.id);
  return { id: data.user.id, email };
}

async function createTestClient(label, suffix, active = true) {
  const { data, error } = await adminApi
    .from("clientes")
    .insert({
      nome: `Cliente ${label}`,
      cpf: validCpf(`${runId}${suffix}`),
      telefone_principal: "44999999999",
      telefone_alternativo: null,
      email: `veiculo-${label.toLowerCase()}-${runId}@mundoar.invalid`,
      cep: "87010000",
      logradouro: "Avenida Teste",
      numero: suffix,
      complemento: null,
      bairro: "Centro",
      cidade: "Maringá",
      estado: "PR",
      observacoes: "Registro removido automaticamente.",
      ativo: active,
    })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Cliente não criado.");
  createdClientIds.push(data.id);
  return data.id;
}

async function authenticatedClient(email) {
  const client = createClient(url, publishableKey, options);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function cleanup() {
  if (createdVehicleIds.length > 0) {
    await adminApi
      .from("historico_proprietarios_veiculos")
      .delete()
      .in("veiculo_id", createdVehicleIds);
    await adminApi.from("veiculos").delete().in("id", createdVehicleIds);
  }
  if (createdClientIds.length > 0) {
    await adminApi.from("clientes").delete().in("id", createdClientIds);
  }
  if (createdUserIds.length > 0) {
    await adminApi.from("perfis_usuarios").delete().in("id", createdUserIds);
    await Promise.all(
      createdUserIds.map((id) => adminApi.auth.admin.deleteUser(id)),
    );
  }
}

try {
  const administrator = await createTestUser("administrador", "administrador");
  const attendant = await createTestUser("atendente", "atendente");
  const inactive = await createTestUser("inativo", "atendente");
  const { error: inactiveProfileError } = await adminApi
    .from("perfis_usuarios")
    .update({ ativo: false })
    .eq("id", inactive.id);
  assert.ifError(inactiveProfileError);

  const firstOwnerId = await createTestClient("Origem", "101");
  const secondOwnerId = await createTestClient("Destino", "102");
  const inactiveOwnerId = await createTestClient("Inativo", "103", false);

  const anonymousClient = createClient(url, publishableKey, options);
  const { error: anonymousReadError } = await anonymousClient
    .from("veiculos")
    .select("id");
  assert.ok(anonymousReadError, "Visitante não pode consultar veículos.");

  const attendantClient = await authenticatedClient(attendant.email);
  const payload = {
    cliente_id: firstOwnerId,
    placa: `RLS${String(Date.now()).slice(-4)}`,
    marca: "Chevrolet",
    modelo: "Onix",
    ano_fabricacao: 2025,
    ano_modelo: 2026,
    cor: "Branco",
    combustivel: "flex",
    observacoes: "Registro removido automaticamente.",
  };
  const { data: inserted, error: insertError } = await attendantClient
    .from("veiculos")
    .insert(payload)
    .select("id, cliente_id, placa, ativo")
    .single();
  assert.ifError(insertError);
  assert.equal(inserted?.cliente_id, firstOwnerId);
  assert.equal(inserted?.ativo, true);
  createdVehicleIds.push(inserted.id);

  const { error: duplicateError } = await attendantClient
    .from("veiculos")
    .insert(payload);
  assert.equal(duplicateError?.code, "23505", "Placa duplicada deve ser rejeitada.");

  const { error: ownerBypassError } = await attendantClient
    .from("veiculos")
    .update({ cliente_id: secondOwnerId })
    .eq("id", inserted.id);
  assert.ok(
    ownerBypassError,
    "O proprietário não pode ser alterado fora da função transacional.",
  );

  const { data: historyId, error: transferError } = await attendantClient.rpc(
    "transferir_proprietario_veiculo",
    {
      p_veiculo_id: inserted.id,
      p_novo_cliente_id: secondOwnerId,
    },
  );
  assert.ifError(transferError);
  assert.ok(historyId, "A transferência deve retornar o histórico criado.");

  const { data: transferred, error: transferredError } = await attendantClient
    .from("veiculos")
    .select("cliente_id")
    .eq("id", inserted.id)
    .single();
  assert.ifError(transferredError);
  assert.equal(transferred?.cliente_id, secondOwnerId);

  const { data: histories, error: historyError } = await attendantClient
    .from("historico_proprietarios_veiculos")
    .select("id, cliente_anterior_id, cliente_novo_id, usuario_id")
    .eq("veiculo_id", inserted.id);
  assert.ifError(historyError);
  assert.equal(histories?.length, 1);
  assert.deepEqual(histories?.[0], {
    id: historyId,
    cliente_anterior_id: firstOwnerId,
    cliente_novo_id: secondOwnerId,
    usuario_id: attendant.id,
  });

  const { error: sameOwnerError } = await attendantClient.rpc(
    "transferir_proprietario_veiculo",
    {
      p_veiculo_id: inserted.id,
      p_novo_cliente_id: secondOwnerId,
    },
  );
  assert.ok(sameOwnerError, "Transferência para o proprietário atual deve falhar.");

  const { error: inactiveOwnerError } = await attendantClient.rpc(
    "transferir_proprietario_veiculo",
    {
      p_veiculo_id: inserted.id,
      p_novo_cliente_id: inactiveOwnerId,
    },
  );
  assert.ok(inactiveOwnerError, "Cliente inativo não pode receber o veículo.");

  const { error: directHistoryError } = await attendantClient
    .from("historico_proprietarios_veiculos")
    .insert({
      veiculo_id: inserted.id,
      cliente_anterior_id: secondOwnerId,
      cliente_novo_id: firstOwnerId,
      usuario_id: attendant.id,
    });
  assert.ok(directHistoryError, "O histórico não aceita inserção direta.");

  const { error: deleteError } = await attendantClient
    .from("veiculos")
    .delete()
    .eq("id", inserted.id);
  assert.ok(deleteError, "A exclusão física deve ser bloqueada.");

  const administratorClient = await authenticatedClient(administrator.email);
  const { data: administratorView, error: administratorViewError } =
    await administratorClient
      .from("veiculos")
      .select("id")
      .eq("id", inserted.id)
      .single();
  assert.ifError(administratorViewError);
  assert.equal(administratorView?.id, inserted.id);

  const inactiveClient = await authenticatedClient(inactive.email);
  const { error: inactiveInsertError } = await inactiveClient
    .from("veiculos")
    .insert({ ...payload, placa: `INA${String(Date.now()).slice(-4)}` });
  assert.ok(inactiveInsertError, "Conta inativa não pode cadastrar veículos.");

  console.log(
    "RLS de veículos validado: gestão autorizada, transferência auditada e exclusão bloqueada.",
  );
} finally {
  await cleanup();
}
