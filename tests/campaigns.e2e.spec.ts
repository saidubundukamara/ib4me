import { test, expect } from "@playwright/test";

test("register, sign in, create new campaign", async ({ page }) => {
  const unique = Math.random().toString(36).slice(2);
  const email = `user_${unique}@example.com`;
  const password = "Passw0rd!";

  await page.goto("/auth/register");
  await page.getByLabel("Full name").fill("Playwright User");
  await page.getByLabel("Email (optional)").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Register" }).click();

  // After register we should be redirected to home or signed in
  await page.waitForURL(/\/?$/);

  // Navigate to user campaigns and start a new one
  await page.goto("/dashboard/campaigns");
  await page.getByRole("link", { name: "New Campaign" }).click();

  // Step: details
  await page.getByLabel("Title").fill("Test Campaign " + unique);
  await page.getByLabel("Campaign Type").fill("Education");
  await page.getByLabel("Urgency").selectOption("high");
  await page.getByLabel("Key Details").fill("School fees needed");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step: beneficiary
  await page.getByLabel("Beneficiary Name").fill("John Doe");
  await page.getByLabel("Age").fill("42");
  await page.getByLabel("Organization / Institution").fill("City School");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step: goal
  await page.getByLabel("Goal Amount").fill("5000");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step: story
  await page
    .getByLabel("Story")
    .fill("This is a test campaign created by Playwright.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step: documents (optional, skip file upload in CI)
  await page.getByRole("button", { name: "Continue" }).click();

  // Step: review and submit
  await page.getByRole("button", { name: "Create Campaign" }).click();

  // Should land on detail page
  await expect(page).toHaveURL(/\/dashboard\/campaigns\/[a-f0-9]{24}$/);
  await expect(page.getByRole("heading", { level: 2 })).toContainText(
    "test-campaign"
  );
});

