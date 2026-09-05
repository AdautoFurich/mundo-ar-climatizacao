import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const canRunAuthenticatedReview = Boolean(url && publishableKey && secretKey);

test.describe("dashboard autenticado", () => {
  test.skip(
    !canRunAuthenticatedReview,
    "Credenciais do Supabase ausentes para a revisão autenticada.",
  );

  const runId = Date.now() + "-" + Math.random().toString(16).slice(2);
  const email = "dashboard-" + runId + "@mundoar.invalid";
  const password = "MundoAr!Dashboard2026#";
  let userId = "";

  test.beforeAll(async () => {
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: "Adauto Furich", perfil: "administrador" },
    });

    if (error || !data.user) {
      throw error ?? new Error("Usuário temporário não criado.");
    }
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    const admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.from("perfis_usuarios").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  });

  test("reproduz a visão geral na resolução de referência", async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar no sistema" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "Visão geral" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ordens recentes" }),
    ).toBeVisible();
    await expect(page.getByText("Próximas ações")).toBeVisible();
    await expect(page.locator('img[alt="Mundo Ar Climatização"]:visible')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    await page.screenshot({
      path: "test-results/dashboard-desktop.png",
      fullPage: false,
    });

    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1280, height: 720 },
      { width: 1024, height: 600 },
    ]) {
      await page.setViewportSize(viewport);

      const sidebar = page.getByTestId("desktop-sidebar");
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole("button", { name: "Sair" })).toBeVisible();
      await expect
        .poll(() =>
          sidebar.evaluate(
            (element) => element.scrollHeight <= element.clientHeight,
          ),
        )
        .toBe(true);
    }

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(
        page.getByRole("heading", { name: "Visão geral" }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
    }

    await page.screenshot({
      path: "test-results/dashboard-mobile.png",
      fullPage: false,
    });
  });
});
