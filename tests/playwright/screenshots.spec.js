import { test, expect } from '@playwright/test';

test.describe('Modulista Screenshots for PR', () => {
  test('capture homepage with full CSS styling', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all CSS and fonts to load
    await page.waitForLoadState('networkidle');
    
    // Wait for any dynamic content to render
    await page.waitForTimeout(2000);
    
    // Add sample data to make the screenshot more informative
    await page.getByTestId('add-item-button').click();
    await page.locator('#item-value').fill('Aplicação para gerenciar dados hierárquicos');
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // Add a number type item
    await page.getByTestId('add-item-button').click();
    await page.getByRole('textbox', { name: 'Nome' }).fill('Versão');
    await page.getByText('Número').click();
    await page.locator('#item-value').fill('1.0');
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // Wait for items to be added
    await page.waitForTimeout(500);
    
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
    
    // Add complex sample data via text editor to show custom format
    await page.locator('span').filter({ hasText: 'Texto' }).click();
    await page.locator('#text-editor-text-content').fill('{ Aplicacao: "Modulista" Versao: 1.0 Descricao: "Sistema para gerenciar dados hierárquicos" Ativo: @1 }');
    await page.locator('#save-text-btn-text-content').click();
    
    // Switch back to list view
    await page.locator('span').filter({ hasText: 'Lista' }).click();
    
    // Wait for the items to be processed and UI to update
    await page.waitForTimeout(1000);
    
    // Take screenshot of the list view with data
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/list-view-with-data.png',
      fullPage: true 
    });
    
    // Verify the items were added
    await expect(page.locator('text=Aplicacao')).toBeVisible();
    await expect(page.locator('text=Modulista')).toBeVisible();
  });

  test('capture text view with custom format', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Switch to text view
    await page.locator('span').filter({ hasText: 'Texto' }).click();
    
    // Add comprehensive sample custom format text that showcases all data types
    const sampleText = `{
  Aplicacao: "Modulista"
  Versao: 1.0
  Configuracoes: {
    tema: "escuro"
    notificacoes: @1
    autoSalvar: @0
  }
  Usuario: {
    nome: "Administrador"
    nivel: 5
    ativo: @1
  }
}`;
    
    await page.locator('#text-editor-text-content').fill(sampleText);
    
    // Wait for text to be displayed
    await page.waitForTimeout(500);
    
    // Take screenshot of text view showing the custom format
    await page.screenshot({ 
      path: 'tests/playwright/screenshots/text-view-custom-format.png',
      fullPage: true 
    });
    
    // Verify text was entered
    await expect(page.locator('#text-editor-text-content')).toHaveValue(sampleText);
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