import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('UI Functionality Tests (formerly Playwright screenshots)', () => {
  let dom;
  let document;
  let window;

  beforeEach(async () => {
    // Load the actual HTML file
    const htmlPath = path.join(__dirname, '..', 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Remove the external script loading and replace with a mock to avoid network requests
    htmlContent = htmlContent.replace(
      '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>',
      ''
    );

    dom = new JSDOM(htmlContent, {
      url: 'http://localhost:8000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    document = dom.window.document;
    window = dom.window;
    
    // Mock necessary APIs for the application
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Mock fetch for icon loading
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('src/icons/') && url.endsWith('.svg')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<svg>mock icon</svg>')
        });
      }
      return Promise.resolve({
        ok: false,
        text: () => Promise.reject(new Error('Mock fetch error'))
      });
    });

    // Add structuredClone polyfill
    global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));

    // Make window and document global for modules
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    global.localStorage = window.localStorage;

    // Wait for DOM to be ready and app to initialize
    await new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });

    // Give some time for the app to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    dom.window.close();
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.localStorage;
    delete global.fetch;
    delete global.structuredClone;
  });

  test('validate homepage structure and basic elements', () => {
    // Verify the page loaded correctly with basic structure from the real HTML file
    expect(document.body).toBeTruthy();
    expect(document.querySelector('header')).toBeTruthy();
    expect(document.querySelector('h1').textContent).toBe('Modulista');
    expect(document.querySelector('#app-container')).toBeTruthy();
    expect(document.querySelector('#breadcrumb')).toBeTruthy();
    
    // Check for expected classes (CSS structure validation) from real HTML
    expect(document.body.className).toContain('bg-gray-100');
    expect(document.querySelector('header').className).toContain('bg-blue-600');
    expect(document.querySelector('h1').className).toContain('text-2xl');
    
    // Verify that the real HTML file structure is being used
    expect(document.querySelector('meta[name="viewport"]')).toBeTruthy();
    expect(document.querySelector('meta[charset="UTF-8"]')).toBeTruthy();
    expect(document.title).toBe('Modulista');
  });

  test('validate list view functionality - using real components', async () => {
    // Import and test the real list view component
    const { createItemRow } = await import('../src/components/list-view.js');
    
    // Create a sample item to test with
    const sampleItem = {
      id: 'test-id',
      path: '/',
      name: 'Test Item',
      type: 'text',
      value: 'Test Value'
    };

    // Test the real createItemRow function
    const itemRow = await createItemRow(sampleItem);
    
    // Verify the returned element structure
    expect(itemRow.tagName).toBe('LI');
    expect(itemRow.dataset.id).toBe('test-id');
    expect(itemRow.className).toContain('p-4');
    expect(itemRow.className).toContain('bg-white');
    expect(itemRow.className).toContain('rounded-lg');
    
    // Verify the content includes the item name
    expect(itemRow.textContent).toContain('Test Item');
  });

  test('validate text view functionality - using real custom parser', async () => {
    // Import and test the real custom parser (correct function name is 'parse')
    const { parse } = await import('../src/custom-parser.js');
    
    // Test the real parser with the custom format
    const customFormatText = `{
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
    
    // Parse the custom format using the real parser
    const parsed = parse(customFormatText);
    
    // Verify the parsing results
    expect(parsed).toBeTruthy();
    expect(parsed.user).toBeTruthy();
    expect(parsed.user.name).toBe('João');
    expect(parsed.user.age).toBe(30);
    expect(parsed.user.active).toBe(true);
    expect(parsed.settings.theme).toBe('dark');
    expect(parsed.settings.notifications).toBe(false);
    
    // Also test that the text view component can be loaded
    const { displayTextContent } = await import('../src/components/text-view.js');
    expect(displayTextContent).toBeTruthy();
    expect(typeof displayTextContent).toBe('function');
  });

  test('validate breadcrumb and navigation - using real components', async () => {
    // Import and test the real breadcrumb component
    const { createBreadcrumb } = await import('../src/components/breadcrumb.js');
    
    // Set a hash for testing breadcrumb
    window.location.hash = '#/folder1/folder2/';
    
    // Test breadcrumb creation (it returns a DOM element, not a string)
    const breadcrumbElement = await createBreadcrumb();
    
    // Verify breadcrumb structure
    expect(breadcrumbElement).toBeTruthy();
    expect(breadcrumbElement.nodeType).toBe(1); // Element node
    expect(breadcrumbElement.tagName).toBe('DIV');
    expect(breadcrumbElement.className).toContain('flex items-center');
    
    // Check that buttons were created for each path segment
    const buttons = breadcrumbElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0); // At least home button + folder buttons
    
    // Check that children exist (including home button and potentially separators)
    expect(breadcrumbElement.children.length).toBeGreaterThan(0);
    
    // Test with root path
    window.location.hash = '#/';
    const rootBreadcrumb = await createBreadcrumb();
    expect(rootBreadcrumb).toBeTruthy();
    expect(rootBreadcrumb.nodeType).toBe(1); // Element node
    
  });

  test('validate types and icon loading - using real modules', async () => {
    // Import and test the real types module
    const { itemTypes } = await import('../src/types.js');
    
    // Verify that all expected types exist
    expect(itemTypes.text).toBeTruthy();
    expect(itemTypes.number).toBeTruthy();
    expect(itemTypes.boolean).toBeTruthy();
    expect(itemTypes.list).toBeTruthy();
    
    // Verify type properties (using 'rótulo' instead of 'label')
    expect(itemTypes.text.rótulo).toBe('Texto');
    expect(itemTypes.number.rótulo).toBe('Número');
    expect(itemTypes.boolean.rótulo).toBe('Lógico');
    expect(itemTypes.list.rótulo).toBe('Lista');
    
    // Test icon loading
    const { loadIcon } = await import('../src/icon-loader.js');
    expect(loadIcon).toBeTruthy();
    expect(typeof loadIcon).toBe('function');
    
    // Test loading an icon (should return Material Icons HTML)
    const textIcon = await loadIcon(itemTypes.text.ícone);
    expect(typeof textIcon).toBe('string');
    expect(textIcon).toContain('material-icons'); // Should contain Material Icons class
    expect(textIcon).toContain('text_fields'); // Should contain the Material Icon name
  });

  test('validate database integration - using real db module', async () => {
    // Import and test the real database module
    const { initDB, addItem, getItems } = await import('../src/db.js');
    
    // Initialize the database
    await initDB();
    
    // Test adding an item using the real function
    const testItem = {
      path: '/',
      name: 'Test Database Item',
      type: 'text',
      value: 'Test value from real DB'
    };
    
    await addItem(testItem);
    
    // Test retrieving items using the real function
    const items = await getItems('/');
    
    // Verify the item was added correctly
    const addedItem = items.find(item => item.name === 'Test Database Item');
    expect(addedItem).toBeTruthy();
    expect(addedItem.type).toBe('text');
    expect(addedItem.value).toBe('Test value from real DB');
  });
});