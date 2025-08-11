import { test, expect } from '@playwright/test';

test.describe('Modulista Screenshots for PR', () => {
  test('capture homepage with full CSS styling', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all CSS and fonts to load
    await page.waitForLoadState('networkidle');
    
    // Wait for any dynamic content to render
    await page.waitForTimeout(1000);
    
    // Take full page screenshot with proper CSS styling
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/homepage-full.png', 
      fullPage: true 
    });
    
    // Verify the page loaded correctly
    await expect(page.locator('body')).toBeVisible();
  });

  test('capture list view with sample data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Add a test item to show functionality
    await page.click('button[title="Adicionar item"]');
    await page.fill('input[placeholder="Nome do item"]', 'Screenshot Test Item');
    await page.selectOption('select', 'text');
    await page.fill('input[placeholder="Valor"]', 'This is a test value for screenshots');
    await page.click('button:has-text("Salvar")');
    
    // Wait for the item to be added and UI to update
    await page.waitForTimeout(500);
    
    // Take screenshot of the list view with data
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/list-view-with-data.png' 
    });
    
    // Verify the item was added
    await expect(page.locator('text=Screenshot Test Item')).toBeVisible();
  });

  test('capture text view with custom format', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Switch to text view
    await page.click('button:has-text("Texto")');
    
    // Add some sample custom format text
    const sampleText = `{
  user: {
    name: "João"
    age: 30
    active: @1
  }
  settings: {
    theme: "dark"
    notifications: @0
  }
}`;
    
    await page.fill('textarea', sampleText);
    await page.click('button[title="Aplicar alterações"]');
    
    // Wait for processing
    await page.waitForTimeout(500);
    
    // Take screenshot of text view
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/text-view-custom-format.png' 
    });
    
    // Verify text was processed
    await expect(page.locator('textarea')).toHaveValue(sampleText);
  });

  test('capture responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/mobile-view.png',
      fullPage: true 
    });
    
    // Verify mobile layout
    await expect(page.locator('body')).toBeVisible();
  });
});