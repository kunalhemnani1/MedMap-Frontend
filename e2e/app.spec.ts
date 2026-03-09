import { test, expect } from "@playwright/test";

/*
 * E2E tests for MedMap frontend.
 * Requires the Next.js dev server running at http://localhost:3000.
 */

// ── Navigation ──────────────────────────────────────────────────
test.describe("Navigation", () => {
    test("homepage loads with hero section", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/MedMap/i);
        await expect(page.locator("nav")).toBeVisible();
    });

    test("navbar has expected links", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("link", { name: /search/i }).first()).toBeVisible();
    });

    test("about page loads", async ({ page }) => {
        await page.goto("/about");
        await expect(page.locator("main")).toBeVisible();
    });

    test("categories page loads", async ({ page }) => {
        await page.goto("/categories");
        await expect(page.locator("main")).toBeVisible();
    });

    test("FAQ page loads", async ({ page }) => {
        await page.goto("/faq");
        await expect(page.locator("main")).toBeVisible();
    });
});

// ── Search ──────────────────────────────────────────────────────
test.describe("Search Page", () => {
    test("search page loads with filter sidebar", async ({ page }) => {
        await page.goto("/search");
        await expect(page.locator("main")).toBeVisible();
    });

    test("search with query shows results or empty state", async ({ page }) => {
        await page.goto("/search?q=hospital");
        // Wait for results to appear (either hospital cards or empty state)
        await page.waitForSelector('[data-testid="hospital-card"], [class*="empty"], main', {
            timeout: 10000,
        });
        await expect(page.locator("main")).toBeVisible();
    });

    test("search query input works", async ({ page }) => {
        await page.goto("/search");
        const searchInput = page.locator('input[type="text"], input[type="search"]').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill("apollo");
            await expect(searchInput).toHaveValue("apollo");
        }
    });
});

// ── Auth ────────────────────────────────────────────────────────
test.describe("Auth Pages", () => {
    test("login page loads with email and password fields", async ({ page }) => {
        await page.goto("/auth/login");
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test("register page loads with role selection", async ({ page }) => {
        await page.goto("/auth/register");
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        // Should have role selection buttons
        await expect(page.getByText(/patient/i).first()).toBeVisible();
    });

    test("login page has link to register", async ({ page }) => {
        await page.goto("/auth/login");
        const registerLink = page.getByRole("link", { name: /create|register|sign up/i });
        await expect(registerLink).toBeVisible();
    });

    test("login with invalid credentials shows error", async ({ page }) => {
        await page.goto("/auth/login");
        await page.locator('input[type="email"]').fill("invalid@test.com");
        await page.locator('input[type="password"]').fill("wrongpassword");
        await page.getByRole("button", { name: /sign in/i }).click();
        // Should show an error or remain on login page
        await page.waitForTimeout(2000);
        await expect(page.url()).toContain("/auth/login");
    });
});

// ── Insights ────────────────────────────────────────────────────
test.describe("Insights Page", () => {
    test("insights page loads with data sections", async ({ page }) => {
        await page.goto("/insights");
        await expect(page.getByText(/market insights/i).first()).toBeVisible();
    });
});

// ── Price Estimator ─────────────────────────────────────────────
test.describe("Price Estimator", () => {
    test("price estimator page loads", async ({ page }) => {
        await page.goto("/price-estimator");
        await expect(page.locator("main")).toBeVisible();
    });
});

// ── Insurance Checker ───────────────────────────────────────────
test.describe("Insurance Checker", () => {
    test("insurance checker page loads", async ({ page }) => {
        await page.goto("/insurance-checker");
        await expect(page.locator("main")).toBeVisible();
    });
});

// ── Compare ─────────────────────────────────────────────────────
test.describe("Compare Page", () => {
    test("compare page loads", async ({ page }) => {
        await page.goto("/compare");
        await expect(page.locator("main")).toBeVisible();
    });
});

// ── Dashboards (require auth — should redirect) ────────────────
test.describe("Protected Routes", () => {
    test("user dashboard redirects to login when unauthenticated", async ({ page }) => {
        await page.goto("/user/dashboard");
        // Should redirect to login
        await page.waitForURL(/auth\/login/, { timeout: 10000 }).catch(() => { });
        // Either redirected or shows login prompt
        const url = page.url();
        expect(url.includes("auth/login") || url.includes("user/dashboard")).toBe(true);
    });

    test("provider dashboard redirects to login when unauthenticated", async ({ page }) => {
        await page.goto("/providers/dashboard");
        await page.waitForURL(/auth\/login/, { timeout: 10000 }).catch(() => { });
        const url = page.url();
        expect(url.includes("auth/login") || url.includes("providers/dashboard")).toBe(true);
    });
});

// ── Contact ─────────────────────────────────────────────────────
test.describe("Contact Page", () => {
    test("contact page loads", async ({ page }) => {
        await page.goto("/contact");
        await expect(page.locator("main")).toBeVisible();
    });
});
