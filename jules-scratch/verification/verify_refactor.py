import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        # Navigate to the local server
        page.goto('http://localhost:8081')

        page.wait_for_load_state('domcontentloaded')

        # 1. Add a new item
        add_button = page.get_by_test_id("add-item-button")
        expect(add_button).to_be_visible(timeout=10000)
        add_button.click()

        # Expect the modal to be visible
        expect(page.locator("#modal-backdrop")).to_be_visible()
        page.locator("#item-name").fill("My New Item")

        # Open type selector and choose 'Number'
        page.locator("#type-selector-btn").click()
        page.get_by_text("Número").click()

        page.get_by_role("button", name="Salvar").click()

        # Verify the item was added
        expect(page.get_by_text("My New Item")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_item_added.png")

        # 2. Rename the item
        item_row = page.get_by_text("My New Item").locator('xpath=./ancestor::li')
        item_row.get_by_role("button").first.click()
        page.get_by_text("Renomear").click()

        expect(page.locator("#modal-backdrop")).to_be_visible()
        page.locator("#item-new-name").fill("My Renamed Item")
        page.get_by_role("button", name="Salvar").click()

        # Verify the item was renamed
        expect(page.get_by_text("My Renamed Item")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_item_renamed.png")

        # 3. Delete the item
        renamed_item_row = page.get_by_text("My Renamed Item").locator('xpath=./ancestor::li')
        renamed_item_row.get_by_role("button").first.click()

        # Handle the confirmation dialog
        page.once("dialog", lambda dialog: dialog.accept())
        page.get_by_text("Excluir").click()

        # Verify the item was deleted
        expect(page.get_by_text("My Renamed Item")).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/03_item_deleted.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
