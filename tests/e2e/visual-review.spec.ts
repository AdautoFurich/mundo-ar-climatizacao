import { expect, test } from "@playwright/test";

test("mantém o acesso inteiro nas alturas comuns de desktop", async ({ page }) => {
  const desktopViewports = [
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1672, height: 941 },
    { width: 1920, height: 1080 },
  ];

  for (const viewport of desktopViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Acessar Sistema" })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollHeight <= window.innerHeight &&
            document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }

  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: false,
  });
});

test("mantém o acesso responsivo em tela estreita", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Acessar Sistema" })).toBeVisible();
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