import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local index.html file
        await page.goto("file:///app/index.html")
        await page.wait_for_load_state('networkidle')

        # Let's wait for a bit to ensure all JS has loaded and executed.
        await page.wait_for_timeout(3000)

        # Wait for the button to be visible and then click it
        add_button = page.get_by_test_id("add-item-button")
        await expect(add_button).to_be_visible()
        await add_button.click()

        # The app automatically navigates to the new item's edit page.
        # The default name is "Item". Let's wait for the form to appear.
        await expect(page.locator("#edit-item-form-1")).to_be_visible()

        # Now, let's change the type to "Número"
        await page.locator('#type-selector-btn').click()
        await page.get_by_text("Número", exact=True).click()

        # After changing the type, the form will re-render.
        # We need to wait for the new form to appear, which will have the same ID.
        await expect(page.locator("#edit-item-form-1")).to_be_visible()

        # And we expect the number input to be there.
        await expect(page.locator('input[name="value"]')).to_be_visible()

        # Take a screenshot of the edit form
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())
