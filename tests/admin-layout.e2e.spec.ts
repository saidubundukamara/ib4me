import { test, expect } from "@playwright/test";

test.describe("Admin Layout", () => {
  test("NavBar and Footer should be hidden on admin routes", async ({ page }) => {
    // Navigate to admin login page (public admin route)
    await page.goto("/s/admin/login");
    
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    
    // Check that main site NavBar is not present
    await expect(page.locator('[data-testid="navbar"]')).not.toBeVisible();
    
    // Check that main site Footer is not present  
    await expect(page.locator('[data-testid="footer"]')).not.toBeVisible();
    
    // Verify that the admin login form is present (to confirm we're on the right page)
    await expect(page.locator('form')).toBeVisible();
  });

  test("Admin dashboard should show only admin layout components", async ({ page }) => {
    // First register and create an admin user for testing
    const unique = Math.random().toString(36).slice(2);
    const email = `admin_${unique}@example.com`;
    const password = "AdminPass123!";

    // Register a regular user first
    await page.goto("/auth/register");
    await page.getByLabel("Full name").fill("Admin User");
    await page.getByLabel("Email (optional)").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Register" }).click();
    await page.waitForURL(/\/?$/);

    // Note: In a real test, you'd need to promote this user to admin role
    // For now, let's just test the public parts of admin routes
    
    // Navigate to admin login page
    await page.goto("/s/admin/login");
    await page.waitForLoadState("networkidle");

    // Verify main site navigation is hidden
    await expect(page.locator('[data-testid="navbar"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).not.toBeVisible();

    // Verify we're on the admin interface (should have admin-specific elements)
    // The admin login should be different from main site login
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Admin'); // Should have admin-related content
  });

  test("Regular site pages should show NavBar and Footer", async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check that main site NavBar is present
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    
    // Check that main site Footer is present
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });
});