import { test, expect } from "../fixtures";

test.describe.configure({ mode: "serial" });

test.describe("Verify the MRZ Scanner page title and verify user can select different settings", () => {
  test.beforeEach(async ({ mrzScannerPage }) => {
    // Navigate to the MRZ Scanner page
    await mrzScannerPage.navigateTo();
  });

  test("should display the correct title", async ({ mrzScannerPage }) => {
    // Validate the page title
    const title = await mrzScannerPage.getTitle();
    await expect(title).toContain("Dynamsoft MRZ Scanner");
  });

  test('should click "Both" button on the page and validate the header label text', async ({ mrzScannerPage }) => {
    await mrzScannerPage.clickStartButton();

    await mrzScannerPage.clickScanBothButton();
    const selectedBtn = await mrzScannerPage.getSelectedButton();
    await expect(selectedBtn).toHaveText("Both");
  });

  test('should click "ID" button on the page and validate the header label text', async ({ mrzScannerPage }) => {
    await mrzScannerPage.clickStartButton();

    await mrzScannerPage.clickscanIDButton();
    const selectedBtn = await mrzScannerPage.getSelectedButton();
    await expect(selectedBtn).toHaveText("ID");
  });

  test('should click "Passport" button on the page and validate the header label text', async ({ mrzScannerPage }) => {
    await mrzScannerPage.clickStartButton();

    await mrzScannerPage.clickscanPassportButton();
    const selectedBtn = await mrzScannerPage.getSelectedButton();
    await expect(selectedBtn).toHaveText("Passport");
  });
});
