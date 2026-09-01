import { expect, test } from "@playwright/test";

test("registra o acesso em desktop e tela estreita", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Entrar no sistema" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Entrar no sistema" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/login-mobile.png",
    fullPage: true,
  });
});
