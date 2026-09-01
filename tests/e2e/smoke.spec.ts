import { expect, test } from "@playwright/test";

test("abre o dashboard da Mundo Ar", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Ritmo da oficina, agora" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nova ordem de serviço" }),
  ).toBeVisible();
});
