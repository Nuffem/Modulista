import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_path = os.path.abspath('index.html')
        await page.goto(f'file://{file_path}')

        # Wait for the loading text to disappear, with a longer timeout
        await expect(page.get_by_text("Carregando...")).to_be_hidden(timeout=10000)

        # Add the first item
        await page.get_by_test_id('add-item-button').click()
        await page.locator('#item-name').fill('Duplicate Test')
        await page.get_by_role('button', name='Salvar').click()
        await expect(page.get_by_text('Duplicate Test')).to_be_visible()

        # Try to add the same item again
        await page.get_by_test_id('add-item-button').click()
        await page.locator('#item-name').fill('Duplicate Test')

        dialog_message = None
        def handle_dialog(dialog):
            nonlocal dialog_message
            dialog_message = dialog.message
            asyncio.create_task(dialog.dismiss())

        page.on('dialog', handle_dialog)

        await page.get_by_role('button', name='Salvar').click()
        await page.wait_for_timeout(1000) # Wait for dialog to be handled

        assert dialog_message is not None, "Dialog did not appear."
        assert 'já existe' in dialog_message, f"Dialog message was incorrect: {dialog_message}"

        print("Dialog appeared with correct message.")

        # Take a screenshot to show the list with one item, after the failed attempt
        await page.get_by_role('button', name='Cancelar').click()
        await page.screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()
        print("Verification script ran successfully.")

if __name__ == '__main__':
    asyncio.run(main())
