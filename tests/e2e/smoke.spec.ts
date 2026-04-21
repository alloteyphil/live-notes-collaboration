import { expect, test } from "@playwright/test";

test("home page renders marketing shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/PulseNotes/i).first()).toBeVisible();
});

test("protected routes redirect unauthenticated users to sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("invite join route is accessible without auth", async ({ page }) => {
  await page.goto("/join/not-a-real-token");
  await expect(page).toHaveURL(/\/join\/not-a-real-token/);
  await expect(
    page.getByText(/invite not found|join|checking invite|sign in to accept/i).first(),
  ).toBeVisible();
});

test.describe("authenticated smoke paths", () => {
  const workspacePath = process.env.PLAYWRIGHT_SMOKE_WORKSPACE_PATH;
  const notePath = process.env.PLAYWRIGHT_SMOKE_NOTE_PATH;

  test.skip(!workspacePath, "Set PLAYWRIGHT_SMOKE_WORKSPACE_PATH to run this test.");
  test.skip(!notePath, "Set PLAYWRIGHT_SMOKE_NOTE_PATH to run this test.");

  test("workspace path can be opened in an authenticated browser", async ({ page }) => {
    await page.goto(workspacePath!);
    await expect(page).toHaveURL(new RegExp(workspacePath!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("note path can be opened in an authenticated browser", async ({ page }) => {
    await page.goto(notePath!);
    await expect(page).toHaveURL(new RegExp(notePath!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
