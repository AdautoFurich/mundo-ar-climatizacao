import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const canRun = Boolean(url && secretKey);

function validCpf(seed: string) {
  const base = seed.replace(/\D/g, "").slice(-9).padStart(9, "1");
  const digit = (partial: string) => {
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

test.describe("cadastro de clientes", () => {
  test.skip(!canRun, "Credenciais do Supabase ausentes para o fluxo de clientes.");

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e-clientes-${runId}@mundoar.invalid`;
  const password = "MundoAr!ClientesE2E2026#";
  const cpf = validCpf(runId);
  let userId = "";

  test.beforeAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: "Administrador E2E", perfil: "administrador" },
    });
    if (error || !data.user) throw error ?? new Error("Usuário temporário não criado.");
    userId = data.user.id;
  });

  test.afterAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.from("clientes").delete().eq("cpf", cpf);
    if (userId) {
      await admin.from("perfis_usuarios").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("cadastra, busca, edita, inativa e mantém o layout responsivo", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar no sistema" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await page.getByRole("link", { name: "Novo cliente" }).click();
    await expect(page).toHaveURL("/clientes/novo");
    await expect(
      page.getByRole("heading", { name: "Novo cliente" }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/cliente-formulario-desktop.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/cliente-formulario-mobile.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.getByLabel(/Nome completo/).fill("Cliente E2E Inicial");
    await page.getByLabel(/CPF/).fill(cpf);
    await page.getByLabel(/Telefone principal/).fill("44999123456");
    await page.getByLabel("E-mail", { exact: true }).fill(`cliente-${runId}@exemplo.com`);
    await page.getByLabel(/CEP/).fill("87010000");
    await page.getByLabel(/Logradouro/).fill("Avenida Brasil");
    await page.getByLabel(/Número/).fill("100");
    await page.getByLabel(/Bairro/).fill("Centro");
    await page.getByLabel(/Cidade/).fill("Maringá");
    await page.getByLabel(/UF/).fill("PR");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();

    await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]+\?criado=1$/);
    await expect(page.getByRole("status")).toContainText("cadastrado com sucesso");

    await page.getByRole("link", { name: "Editar", exact: true }).click();
    await page.getByLabel(/Nome completo/).fill("Cliente E2E Atualizado");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("atualizados com sucesso");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Inativar cliente" }).click();
    await expect(page.getByRole("status")).toContainText("Cliente inativado");
    await expect(page.getByText("Inativo", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Voltar para clientes" }).click();
    await page.getByLabel("Buscar clientes").fill("E2E Atualizado");
    await page.getByLabel("Filtrar por situação").selectOption("inativos");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("Cliente E2E Atualizado").last()).toBeVisible();

    await page
      .getByRole("link", { name: "Ver detalhes de Cliente E2E Atualizado" })
      .last()
      .click();
    await expect(page).toHaveURL(new RegExp("/clientes/[0-9a-f-]+$"));
    await expect(
      page.getByRole("heading", { name: "Detalhes do cliente" }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reativar cliente" }).click();
    await expect(page.getByRole("status")).toContainText("Cliente reativado");
    await expect(page.getByText("Ativo", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Voltar para clientes" }).click();
    await expect(page).toHaveURL("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "test-results/clientes-desktop.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/clientes-mobile.png",
      fullPage: false,
    });

    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "20px";
    });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  });
});
