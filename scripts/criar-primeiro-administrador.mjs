import { createClient } from "@supabase/supabase-js";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
const email = argument("email")?.toLowerCase();
const name = argument("nome");

if (!url || !secretKey) {
  throw new Error("Configure o arquivo .env.local antes de criar o administrador.");
}

if (!email || !email.includes("@") || !name || name.length < 2) {
  throw new Error(
    'Uso: npm run admin:create -- --email "email@empresa.com" --nome "Nome completo"',
  );
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingAdministrators, error: profileError } = await admin
  .from("perfis_usuarios")
  .select("id")
  .eq("perfil", "administrador")
  .limit(1);

if (profileError) throw profileError;
if (existingAdministrators.length > 0) {
  throw new Error("O sistema já possui um administrador cadastrado.");
}

const { error } = await admin.auth.admin.inviteUserByEmail(email, {
  data: { nome: name, perfil: "administrador" },
  redirectTo: `${siteUrl}/auth/callback?next=/atualizar-senha`,
});

if (error) {
  if (error.status === 422 || error.code === "email_exists") {
    throw new Error("Já existe uma conta cadastrada com esse e-mail.");
  }
  throw error;
}

console.log(`Convite de administrador enviado para ${email}.`);
