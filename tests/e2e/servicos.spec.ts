import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const canRun = Boolean(url && secretKey);

test.describe("catálogo de serviços", () => {
  test.skip(!canRun, "Credenciais do Supabase ausentes para o fluxo de serviços.");

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const password = "MundoAr!ServicosE2E2026#";
  const administratorEmail = `e2e-servicos-admin-${runId}@mundoar.invalid`;
  const attendantEmail = `e2e-servicos-atendente-${runId}@mundoar.invalid`;
  const serviceName = `Higienização E2E ${runId}`;
  const userIds: string[] = [];
  let serviceId = "";

  test.beforeAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const [email, name, role] of [
      [administratorEmail, "Administrador Serviços E2E", "administrador"],
      [attendantEmail, "Atendente Serviços E2E", "atendente"],
    ]) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: name, perfil: role },
      });
      if (error || !data.user) {
        throw error ?? new Error("Usuário temporário não criado.");
      }
      userIds.push(data.user.id);
    }
  });

  test.afterAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (serviceId) await admin.from("servicos").delete().eq("id", serviceId);
    if (userIds.length > 0) {
      await admin.from("perfis_usuarios").delete().in("id", userIds);
      await Promise.all(userIds.map((id) => admin.auth.admin.deleteUser(id)));
    }
  });

  test("administra o catálogo e mantém o atendente somente em consulta", async ({
    page,
  }) => {
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(administratorEmail);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar no sistema" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/servicos");
    await expect(page.getByRole("heading", { name: "Serviços" })).toBeVisible();
    await page.getByRole("link", { name: "Novo serviço" }).click();
    await page.getByLabel(/Nome do serviço/).fill(serviceName);
    await page.getByLabel(/Categoria/).selectOption("climatizacao");
    await page
      .getByLabel(/Descrição/)
      .fill("Limpeza técnica do sistema de ventilação.");
    await page.getByRole("button", { name: "Cadastrar serviço" }).click();

    await expect(page).toHaveURL(/\/servicos\/[0-9a-f-]+\?criado=1$/);
    serviceId = new URL(page.url()).pathname.split("/").at(-1) ?? "";
    await expect(page.getByRole("status")).toContainText("cadastrado com sucesso");
    await expect(page.getByText("A definir", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Editar", exact: true }).click();
    await page.getByLabel(/Valor-base/).fill("250,00");
    await page
      .getByLabel(/Descrição/)
      .fill("Higienização completa do ar-condicionado e da ventilação.");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("atualizados com sucesso");
    await expect(page.getByText(/R\$\s*250,00/)).toBeVisible();

    await page.goto("/servicos");
    await page.getByLabel("Buscar serviços").fill(`E2E ${runId}`);
    await page.getByLabel("Filtrar por categoria").selectOption("climatizacao");
    await page.getByRole("button", { name: "Aplicar" }).click();
    const serviceRow = page.locator("tbody tr").filter({
      has: page.locator(`a[href="/servicos/${serviceId}"]`),
    });
    await expect(serviceRow).toContainText(serviceName);
    await expect(serviceRow).toContainText("R$ 250,00");

    await page.goto(`/servicos/${serviceId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Inativar serviço" }).click();
    await expect(page.getByRole("status")).toContainText("Serviço inativado");
    await expect(page.getByText("Inativo", { exact: true })).toBeVisible();

    await page.goto("/servicos/novo");
    await page.getByLabel(/Nome do serviço/).fill(serviceName.toUpperCase());
    await page.getByLabel(/Categoria/).selectOption("climatizacao");
    await page.getByRole("button", { name: "Cadastrar serviço" }).click();
    await expect(page.getByText(/Já existe um serviço/)).toBeVisible();

    await page.goto(`/servicos/${serviceId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reativar serviço" }).click();
    await expect(page.getByRole("status")).toContainText("Serviço reativado");

    await page.goto("/servicos");
    await page.waitForLoadState("networkidle");
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/servicos-desktop.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/servicos-mobile.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "20px";
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(attendantEmail);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar no sistema" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/servicos");
    await expect(page.getByText(serviceName).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo serviço" })).not.toBeVisible();
    await page.goto(`/servicos/${serviceId}`);
    await expect(page.getByRole("link", { name: "Editar", exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /serviço/ })).not.toBeVisible();

    await page.goto("/servicos/novo");
    await expect(page).toHaveURL("/acesso-negado");
    await page.goto(`/servicos/${serviceId}/editar`);
    await expect(page).toHaveURL("/acesso-negado");
    expect(browserErrors).toEqual([]);
  });
});
