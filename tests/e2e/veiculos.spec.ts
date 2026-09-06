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

test.describe("cadastro de veículos", () => {
  test.skip(!canRun, "Credenciais do Supabase ausentes para o fluxo de veículos.");

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e-veiculos-${runId}@mundoar.invalid`;
  const password = "MundoAr!VeiculosE2E2026#";
  const plate = `VEH${String(Date.now()).slice(-4)}`;
  const clientIds: string[] = [];
  let userId = "";
  let vehicleId = "";

  test.beforeAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: "Administrador Veículos E2E", perfil: "administrador" },
      });
    if (userError || !userData.user) {
      throw userError ?? new Error("Usuário temporário não criado.");
    }
    userId = userData.user.id;

    for (const [index, name] of ["Proprietário Origem E2E", "Proprietário Destino E2E"].entries()) {
      const { data, error } = await admin
        .from("clientes")
        .insert({
          nome: name,
          cpf: validCpf(`${runId}${index + 1}`),
          telefone_principal: "44999999999",
          telefone_alternativo: null,
          email: `cliente-veiculo-${index}-${runId}@mundoar.invalid`,
          cep: "87010000",
          logradouro: "Avenida Teste",
          numero: String(index + 1),
          complemento: null,
          bairro: "Centro",
          cidade: "Maringá",
          estado: "PR",
          observacoes: "Registro removido automaticamente.",
          ativo: true,
        })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Cliente temporário não criado.");
      clientIds.push(data.id);
    }
  });

  test.afterAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (vehicleId) {
      await admin
        .from("historico_proprietarios_veiculos")
        .delete()
        .eq("veiculo_id", vehicleId);
      await admin.from("veiculos").delete().eq("id", vehicleId);
    }
    if (clientIds.length > 0) {
      await admin.from("clientes").delete().in("id", clientIds);
    }
    if (userId) {
      await admin.from("perfis_usuarios").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("cadastra, busca, edita, transfere e altera a situação", async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar no sistema" }).click();
    await expect(page).toHaveURL("/");

    await page.goto(`/clientes/${clientIds[0]}`);
    await page
      .getByRole("link", { name: "Cadastrar veículo para este cliente" })
      .click();
    await expect(page).toHaveURL(`/veiculos/novo?cliente=${clientIds[0]}`);
    await expect(page.getByLabel(/Cliente proprietário/)).toHaveValue(clientIds[0]);

    await page.getByLabel(/^Placa/).fill(plate);
    await page.getByLabel(/^Marca/).fill("Chevrolet");
    await page.getByLabel(/^Modelo/).fill("Onix");
    await page.getByLabel(/Ano de fabricação/).fill("2025");
    await page.getByLabel(/Ano do modelo/).fill("2026");
    await page.getByLabel(/^Cor/).fill("Branco");
    await page.getByLabel(/^Combustível/).selectOption("flex");
    await page.getByLabel(/^Observações/).fill("Veículo sintético do teste E2E.");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();

    await expect(page).toHaveURL(/\/veiculos\/[0-9a-f-]+\?criado=1$/);
    vehicleId = new URL(page.url()).pathname.split("/").at(-1) ?? "";
    await expect(page.getByRole("status")).toContainText("cadastrado com sucesso");
    await expect(page.getByText("Proprietário Origem E2E", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Editar", exact: true }).click();
    await expect(page.getByLabel(/Proprietário atual/)).toBeDisabled();
    await page.getByLabel(/^Modelo/).fill("Onix Plus");
    await page.getByLabel(/^Cor/).fill("Prata");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("atualizados com sucesso");
    await expect(page.getByText("Chevrolet Onix Plus", { exact: false })).toBeVisible();

    await page.goto("/veiculos");
    await page.getByLabel("Buscar veículos").fill(plate);
    await page.getByRole("button", { name: "Aplicar" }).click();
    const vehicleRow = page.locator("tbody tr").filter({
      has: page.locator(`a[href="/veiculos/${vehicleId}"]`),
    });
    await expect(vehicleRow).toContainText("Onix Plus");

    await page.goto(`/clientes/${clientIds[0]}`);
    await expect(page.getByText("Onix Plus", { exact: false })).toBeVisible();
    await page.goto(`/veiculos/${vehicleId}`);
    await page.waitForLoadState("networkidle");
    await page
      .getByLabel(/Novo proprietário/)
      .selectOption(clientIds[1]);
    await expect(page.getByLabel(/Novo proprietário/)).toHaveValue(clientIds[1]);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Transferir veículo" }).click();
    await expect(page.getByRole("status")).toContainText("histórico registrado");
    await expect(page.getByText("Proprietário Destino E2E", { exact: true })).toBeVisible();
    await expect(page.getByText(/Proprietário Origem E2E → Proprietário Destino E2E/)).toBeVisible();

    await page.goto(`/clientes/${clientIds[0]}`);
    await expect(page.getByText("Nenhum veículo vinculado")).toBeVisible();
    await page.goto(`/clientes/${clientIds[1]}`);
    await expect(page.getByText("Onix Plus", { exact: false })).toBeVisible();

    await page.goto(`/veiculos/${vehicleId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Inativar veículo" }).click();
    await expect(page.getByRole("status")).toContainText("Veículo inativado");
    await expect(page.getByText("Inativo", { exact: true })).toBeVisible();

    await page.goto(`/veiculos/novo?cliente=${clientIds[1]}`);
    await page.getByLabel(/^Placa/).fill(plate);
    await page.getByLabel(/^Marca/).fill("Outra marca");
    await page.getByLabel(/^Modelo/).fill("Outro modelo");
    await page.getByLabel(/Ano de fabricação/).fill("2025");
    await page.getByLabel(/Ano do modelo/).fill("2025");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page.getByRole("alert").first()).toContainText("Já existe um veículo");

    await page.goto(`/veiculos/${vehicleId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reativar veículo" }).click();
    await expect(page.getByRole("status")).toContainText("Veículo reativado");

    await page.goto("/veiculos");
    await page.waitForLoadState("networkidle");
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/veiculos-desktop.png",
      fullPage: false,
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/veiculos-mobile.png",
      fullPage: false,
    });
    expect(browserErrors).toEqual([]);
  });
});
