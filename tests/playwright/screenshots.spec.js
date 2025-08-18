import { test, expect } from '@playwright/test';

test.describe('Modulista Screenshots for PR', () => {
  test('capture homepage with full CSS styling', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all CSS and fonts to load
    await page.waitForLoadState('networkidle');
    
    // Wait for any dynamic content to render
    await page.waitForTimeout(2000);
    
    // Wait for essential elements to be loaded
    await page.waitForSelector('button[title="Adicionar item"]', { state: 'visible' });
    
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
    await page.waitForTimeout(1000);
    
    // Add a test item to show functionality
    await page.click('button[title="Adicionar item"]');
    
    // Wait for popup to appear
    await page.waitForSelector('#add-item-popup', { state: 'visible' });
    
    await page.fill('input[placeholder="Nome do item"]', 'Screenshot Test Item');
    
    // Select text type by clicking on the option - wait for it to be available
    await page.waitForSelector('[data-type="text"]', { state: 'visible' });
    await page.click('[data-type="text"]');
    
    await page.click('button:has-text("Salvar")');
    
    // Wait for the item to be added and popup to close
    await page.waitForSelector('#add-item-popup', { state: 'hidden' });
    await page.waitForTimeout(1000);
    
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
    await page.waitForTimeout(1000);
    
    // Switch to text view - wait for tab buttons to be available
    await page.waitForSelector('button:has-text("Texto")', { state: 'visible' });
    await page.click('button:has-text("Texto")');
    
    // Wait for text view content to load
    await page.waitForTimeout(1000);
    
    // Click edit button to enter edit mode
    await page.waitForSelector('#edit-text-btn-tab-content', { state: 'visible' });
    await page.click('#edit-text-btn-tab-content');
    
    // Wait for text editor to appear
    await page.waitForSelector('#text-editor-tab-content', { state: 'visible' });
    
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
    
    await page.fill('#text-editor-tab-content', sampleText);
    
    // Wait for save button to be available and click it
    await page.waitForSelector('button[title="Aplicar alterações"]', { state: 'visible' });
    await page.click('button[title="Aplicar alterações"]');
    
    // Wait for processing and view switch
    await page.waitForTimeout(2000);
    
    // Take screenshot of text view
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/text-view-custom-format.png' 
    });
    
    // Verify text was processed (check if it appears in the display)
    await expect(page.locator('pre code')).toContainText('user');
  });

  test('capture responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for mobile layout to be applied and content to load
    await page.waitForTimeout(2000);
    
    // Wait for essential elements to be loaded
    await page.waitForSelector('button[title="Adicionar item"]', { state: 'visible' });
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/mobile-view.png',
      fullPage: true 
    });
    
    // Verify mobile layout
    await expect(page.locator('body')).toBeVisible();
  });
});