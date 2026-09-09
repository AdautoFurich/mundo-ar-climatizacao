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
const password = "MundoAr!Clientes2026#";
const createdUserIds = [];
const createdClientIds = [];

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
  const email = `clientes-${label}-${runId}@mundoar.invalid`;
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

async function authenticatedClient(email) {
  const client = createClient(url, publishableKey, options);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function cleanup() {
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

  const anonymousClient = createClient(url, publishableKey, options);
  const { error: anonymousReadError } = await anonymousClient
    .from("clientes")
    .select("id");
  assert.ok(anonymousReadError, "Visitante não pode consultar clientes.");

  const attendantClient = await authenticatedClient(attendant.email);
  const cpf = validCpf(runId);
  const payload = {
    nome: "Cliente RLS Temporário",
    cpf,
    telefone_principal: "44999999999",
    telefone_alternativo: null,
    email: `cliente-${runId}@mundoar.invalid`,
    cep: "87010000",
    logradouro: "Avenida Teste",
    numero: "100",
    complemento: null,
    bairro: "Centro",
    cidade: "Maringá",
    estado: "PR",
    observacoes: "Registro removido automaticamente.",
  };
  const { data: inserted, error: insertError } = await attendantClient
    .from("clientes")
    .insert(payload)
    .select("id, cpf, ativo")
    .single();
  assert.ifError(insertError);
  assert.equal(inserted?.cpf, cpf);
  assert.equal(inserted?.ativo, true);
  createdClientIds.push(inserted.id);

  const { error: duplicateError } = await attendantClient
    .from("clientes")
    .insert(payload);
  assert.equal(duplicateError?.code, "23505", "CPF duplicado deve ser rejeitado.");

  const { data: updated, error: updateError } = await attendantClient
    .from("clientes")
    .update({ nome: "Cliente RLS Atualizado", ativo: false })
    .eq("id", inserted.id)
    .select("nome, ativo")
    .single();
  assert.ifError(updateError);
  assert.deepEqual(updated, { nome: "Cliente RLS Atualizado", ativo: false });

  const { error: deleteError } = await attendantClient
    .from("clientes")
    .delete()
    .eq("id", inserted.id);
  assert.ok(deleteError, "A exclusão física deve ser bloqueada.");

  const administratorClient = await authenticatedClient(administrator.email);
  const { data: administratorView, error: administratorViewError } =
    await administratorClient
      .from("clientes")
      .select("id")
      .eq("id", inserted.id)
      .single();
  assert.ifError(administratorViewError);
  assert.equal(administratorView?.id, inserted.id);

  const inactiveClient = await authenticatedClient(inactive.email);
  const { error: inactiveInsertError } = await inactiveClient
    .from("clientes")
    .insert({ ...payload, cpf: validCpf(`${runId}7`) });
  assert.ok(inactiveInsertError, "Conta inativa não pode cadastrar clientes.");

  console.log(
    "RLS de clientes validado: leitura protegida, gestão autorizada e exclusão bloqueada.",
  );
} finally {
  await cleanup();
}
