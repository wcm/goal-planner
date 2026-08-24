import { expect, test } from "@playwright/test";

test("creates, breaks down, completes, and persists a demo plan", async ({ page }) => {
  await page.goto("/");
  const goalInput = page.getByLabel("What is your goal?").first();
  const createButton = page.getByRole("button", { name: "Make it SMART" }).first();
  await expect(createButton).toBeEnabled();
  await page.getByRole("button", { name: "Launch a newsletter" }).first().click({ force: true });
  await expect(goalInput).toHaveValue("I want to launch a newsletter");
  await goalInput.fill("Launch my first useful newsletter");
  await createButton.click();

  await expect(page).toHaveURL(/\/plans\/new/);
  await expect(page.getByLabel("Your SMART goal")).toHaveValue(/Publish one useful newsletter issue/);
  await expect(page.getByLabel("Specific")).toBeVisible();
  await page.getByRole("button", { name: "Continue: add context" }).click();
  await expect(page.getByRole("button", { name: /Make it SMART/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add context to personalise your plan" })).toBeVisible();
  await page.getByRole("button", { name: "A completed deliverable" }).click();
  await page.getByRole("button", { name: "A consistent habit" }).click();
  await expect(page.getByRole("button", { name: "A completed deliverable" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Other" }).first().click();
  await page.getByLabel(/Other answer for/).fill("A practical weekly issue for early-stage product builders.");
  await page.getByRole("button", { name: "Build my execution plan" }).click();
  await expect(page).toHaveURL(/\/plans\/[a-f0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Publish one useful newsletter issue");

  await page.getByRole("button", { name: "Break it down" }).first().click();
  await expect(page.getByLabel("Level 2, step 1").first()).toBeVisible();

  await page.getByRole("button", { name: /Mark as done: Define the finish line/ }).click();
  await expect(page.getByText(/%/).first()).not.toContainText("0%");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Publish one useful newsletter issue");
  await expect(page.getByLabel("Level 2, step 1").first()).toBeVisible();
});

test("makes a goal SMART before asking two context questions with options", async ({ page }) => {
  await page.goto("/plans/new?goal=Learn%20conversational%20Spanish");
  await expect(page.getByLabel("Your SMART goal")).toHaveValue(/10-minute everyday conversation/);
  await page.getByRole("button", { name: "Continue: add context" }).click();
  await expect(page.locator("fieldset.context-question")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Other" })).toHaveCount(2);
  await expect(page.locator("textarea")).toHaveCount(1);
  await page.getByRole("button", { name: "2–5 hours" }).click();
  await page.getByRole("button", { name: "Other" }).nth(1).click();
  await page.getByLabel(/Other answer for/).fill("I can practise during weekday commutes.");
  await page.getByLabel("Anything else that feels critical?").fill("I already know basic greetings and travel phrases.");
  await page.getByRole("button", { name: "Build my execution plan" }).click();
  await expect(page).toHaveURL(/\/plans\/[a-f0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hold a 10-minute everyday conversation");
});
