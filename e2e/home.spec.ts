import { test, expect } from "@playwright/test";

test.describe("Anonymous home page", () => {
  test("loads the hero and shows sign-in CTA", async ({ page }) => {
    await page.goto("/");

    // Hero copy
    await expect(
      page.getByRole("heading", {
        name: /plan your perfect outing in seconds/i,
      })
    ).toBeVisible();
    await expect(page.getByText(/real events nearby/i)).toBeVisible();

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

  test("selecting vibe options enables the submit button", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: /pick options/i }).click();
    await expect(page.getByPlaceholder(/I'm bored/i)).toBeHidden();

    await page.getByRole("button", { name: /Chill/i }).click();
    await page.getByRole("button", { name: /Outdoor/i }).click();

    const submit = page.getByRole("button", { name: /find something fun/i });
    await expect(submit).toBeEnabled();
  });

  test("event filters support keyboard input and expose pressed state", async ({
    page,
  }) => {
    await page.route("**/api/suggest", async (route) => {
      await route.fulfill({
        json: {
          suggestions: [
            {
              title: "Explore a local market",
              emoji: "🛍️",
              description: "Browse local vendors and food stalls.",
              steps: ["Choose a market", "Check the hours", "Head out"],
              details: {
                difficulty: "Easy",
                cost: "Free entry",
                duration: "2 hours",
                bestFor: "Anyone",
                location: "Toronto",
              },
              searchKeyword: "local market",
            },
          ],
        },
      });
    });
    await page.route("**/api/discover?**", async (route) => {
      await route.fulfill({
        json: {
          events: [
            {
              id: "free-market",
              name: "Free Community Market",
              description: "A neighborhood market.",
              url: "https://example.com/free-market",
              start: "2026-08-22T14:00:00.000Z",
              category: "Community",
              venue: {
                name: "Market Hall",
                city: "Toronto",
                address: "1 Main Street",
              },
              isFree: true,
              logo: null,
            },
            {
              id: "paid-concert",
              name: "Evening Concert",
              description: "Live music downtown.",
              url: "https://example.com/paid-concert",
              start: "2026-08-23T23:00:00.000Z",
              category: "Music",
              venue: {
                name: "Concert Hall",
                city: "Toronto",
                address: "2 King Street",
              },
              isFree: false,
              logo: null,
            },
          ],
          continuation: null,
        },
      });
    });

    await page.goto("/");
    await page.getByPlaceholder(/I'm bored/i).fill("Find a market");
    await page.getByRole("button", { name: /find something fun/i }).click();
    await page.getByRole("button", { name: /find events/i }).click();

    const priceFilters = page.getByRole("group", { name: /price/i });
    const anyPrice = priceFilters.getByRole("button", { name: "Any Price" });
    const free = priceFilters.getByRole("button", { name: "Free" });

    await expect(anyPrice).toHaveAttribute("aria-pressed", "true");
    await expect(free).toHaveAttribute("aria-pressed", "false");

    await free.focus();
    await page.keyboard.press("Space");

    await expect(free).toBeFocused();
    await expect(free).toHaveAttribute("aria-pressed", "true");
    await expect(anyPrice).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("Showing 1 of 2 events")).toBeVisible();
  });

  test("API errors are exposed as alerts", async ({ page }) => {
    await page.route("**/api/suggest", async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: "Suggestions are temporarily unavailable." },
      });
    });

    await page.goto("/");
    await page.getByPlaceholder(/I'm bored/i).fill("Find something outdoors");
    await page.getByRole("button", { name: /find something fun/i }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Suggestions are temporarily unavailable." })
    ).toHaveText("Suggestions are temporarily unavailable.");
  });
});
