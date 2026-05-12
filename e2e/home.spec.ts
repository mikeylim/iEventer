import { test, expect } from "@playwright/test";

test.describe("Anonymous home page", () => {
  test("loads the hero and shows sign-in CTA", async ({ page }) => {
    await page.goto("/");

    // Hero copy
    await expect(page.getByRole("heading", { name: "Bored?" })).toBeVisible();
    await expect(page.getByText(/Let AI find your next adventure/i)).toBeVisible();

    // The top nav should offer sign-in (since we're not signed in)
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // No daily-pick card for anonymous users
    await expect(page.getByText(/Today's Surprise Pick/i)).toHaveCount(0);
  });

  test("the find-something-fun button requires input", async ({ page }) => {
    await page.goto("/");

    const submit = page.getByRole("button", { name: /find something fun/i });
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled();
  });

  test("typing into the prompt enables the submit button", async ({ page }) => {
    await page.goto("/");

    const textarea = page.getByPlaceholder(/I'm bored/i);
    await textarea.fill("I want to do something outdoors this weekend");

    const submit = page.getByRole("button", { name: /find something fun/i });
    await expect(submit).toBeEnabled();
  });
});
