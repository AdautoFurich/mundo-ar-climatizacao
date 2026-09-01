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
const password = "MundoAr!Rls2026#";
const createdUserIds = [];

async function createTestUser(label, role) {
  const email = `rls-${label}-${runId}@mundoar.invalid`;
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
  if (createdUserIds.length === 0) return;

  await adminApi.from("perfis_usuarios").delete().in("id", createdUserIds);
  await Promise.all(
    createdUserIds.map((id) => adminApi.auth.admin.deleteUser(id)),
  );
}

try {
  const administrator = await createTestUser("administrador", "administrador");
  const technician = await createTestUser("tecnico", "tecnico");
  const attendant = await createTestUser("atendente", "atendente");

  const technicianClient = await authenticatedClient(technician.email);
  const { data: technicianView, error: technicianViewError } =
    await technicianClient.from("perfis_usuarios").select("id, perfil");
  assert.ifError(technicianViewError);
  assert.deepEqual(technicianView?.map(({ id }) => id), [technician.id]);

  const { data: forbiddenUpdate, error: forbiddenUpdateError } =
    await technicianClient
      .from("perfis_usuarios")
      .update({ ativo: false })
      .eq("id", administrator.id)
      .select("id");
  assert.ifError(forbiddenUpdateError);
  assert.equal(forbiddenUpdate?.length, 0);

  const administratorClient = await authenticatedClient(administrator.email);
  const { data: administratorView, error: administratorViewError } =
    await administratorClient.from("perfis_usuarios").select("id");
  assert.ifError(administratorViewError);
  const visibleUserIds = new Set(
    administratorView?.map(({ id }) => id) ?? [],
  );
  assert.equal(
    createdUserIds.every((id) => visibleUserIds.has(id)),
    true,
    "O administrador deve visualizar todos os usuários temporários.",
  );

  const { data: allowedUpdate, error: allowedUpdateError } =
    await administratorClient
      .from("perfis_usuarios")
      .update({ ativo: false })
      .eq("id", attendant.id)
      .select("id, ativo")
      .single();
  assert.ifError(allowedUpdateError);
  assert.equal(allowedUpdate?.ativo, false);

  console.log("RLS validado: isolamento individual e administração autorizada.");
} finally {
  await cleanup();
}
