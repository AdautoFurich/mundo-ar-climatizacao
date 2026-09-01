import { expect, test } from "@playwright/test";

test("protege o dashboard e apresenta o login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\?next=%2F$/);
  await expect(
    page.getByRole("heading", { name: "Acessar Sistema" }),
  ).toBeVisible();
  const logo = page.locator('img[alt="Mundo Ar Climatização"]:visible');
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((image) => {
    const loadedImage = image as HTMLImageElement;
    return loadedImage.complete && loadedImage.naturalWidth > 0;
  })).toBe(true);
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar no sistema" }),
  ).toBeVisible();
});

test("valida os dados antes de tentar entrar", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("type", "text");
  await page.getByLabel("E-mail").fill("email-invalido");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();

  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
});
