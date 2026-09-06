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
const password = "MundoAr!Servicos2026#";
const createdUserIds = [];
const createdServiceIds = [];

async function createTestUser(label, role) {
  const email = `servicos-${label}-${runId}@mundoar.invalid`;
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
  if (createdServiceIds.length > 0) {
    await adminApi.from("servicos").delete().in("id", createdServiceIds);
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
    .from("servicos")
    .select("id");
  assert.ok(anonymousReadError, "Visitante não pode consultar serviços.");

  const administratorClient = await authenticatedClient(administrator.email);
  const serviceName = `Higienização RLS ${runId}`;
  const payload = {
    nome: serviceName,
    categoria: "climatizacao",
    descricao: "Registro removido automaticamente.",
    valor_base: 180.5,
  };
  const { data: inserted, error: insertError } = await administratorClient
    .from("servicos")
    .insert(payload)
    .select("id, nome, categoria, valor_base, ativo")
    .single();
  assert.ifError(insertError);
  assert.equal(inserted?.nome, serviceName);
  assert.equal(inserted?.ativo, true);
  createdServiceIds.push(inserted.id);

  const attendantClient = await authenticatedClient(attendant.email);
  const { data: attendantView, error: attendantViewError } =
    await attendantClient
      .from("servicos")
      .select("id")
      .eq("id", inserted.id)
      .single();
  assert.ifError(attendantViewError);
  assert.equal(attendantView?.id, inserted.id);

  const { error: attendantInsertError } = await attendantClient
    .from("servicos")
    .insert({ ...payload, nome: `${serviceName} atendente` });
  assert.ok(attendantInsertError, "Atendente não pode cadastrar serviços.");

  const { data: attendantUpdate, error: attendantUpdateError } =
    await attendantClient
      .from("servicos")
      .update({ valor_base: 1 })
      .eq("id", inserted.id)
      .select("id");
  assert.ok(
    attendantUpdateError || attendantUpdate?.length === 0,
    "Atendente não pode editar serviços.",
  );

  const inactiveClient = await authenticatedClient(inactive.email);
  const { data: inactiveView, error: inactiveViewError } = await inactiveClient
    .from("servicos")
    .select("id")
    .eq("id", inserted.id);
  assert.ok(
    inactiveViewError || inactiveView?.length === 0,
    "Conta inativa não pode consultar serviços.",
  );

  const { error: negativeValueError } = await administratorClient
    .from("servicos")
    .insert({ ...payload, nome: `${serviceName} negativo`, valor_base: -1 });
  assert.equal(negativeValueError?.code, "23514");

  const { error: invalidCategoryError } = await administratorClient
    .from("servicos")
    .insert({ ...payload, nome: `${serviceName} categoria`, categoria: "estoque" });
  assert.equal(invalidCategoryError?.code, "23514");

  const { error: nonCanonicalError } = await administratorClient
    .from("servicos")
    .insert({ ...payload, nome: `  ${serviceName}  ` });
  assert.equal(nonCanonicalError?.code, "23514");

  const { error: inactiveServiceError } = await administratorClient
    .from("servicos")
    .update({ ativo: false })
    .eq("id", inserted.id);
  assert.ifError(inactiveServiceError);

  const { error: duplicateError } = await administratorClient
    .from("servicos")
    .insert({ ...payload, nome: serviceName.toUpperCase() });
  assert.equal(
    duplicateError?.code,
    "23505",
    "Nome e categoria duplicados devem ser rejeitados mesmo com registro inativo.",
  );

  const { data: anotherCategory, error: anotherCategoryError } =
    await administratorClient
      .from("servicos")
      .insert({ ...payload, categoria: "diagnostico" })
      .select("id")
      .single();
  assert.ifError(anotherCategoryError);
  createdServiceIds.push(anotherCategory.id);

  const { error: deleteError } = await administratorClient
    .from("servicos")
    .delete()
    .eq("id", inserted.id);
  assert.ok(deleteError, "A exclusão física deve ser bloqueada.");

  console.log(
    "RLS de serviços validado: equipe consulta, somente administrador gerencia e exclusão permanece bloqueada.",
  );
} finally {
  await cleanup();
}
