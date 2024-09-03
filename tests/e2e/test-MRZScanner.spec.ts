import { test, expect } from '../fixtures';

// Adding userAgent to avoid firefox headless mode to block the script as it is being detected as bot.
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0"; 


test.describe.configure({ mode: 'serial' });

test.describe("Verify the VIN Scanner Page title and veirfy user can select different settings", () => {
  test.use({userAgent});

  test.beforeEach(async ({ mrzScannerPage }) => {
    
    // Navigate to the VIN Scanner page
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
    await expect(selectedBtn).toHaveText('Both');

  });

  test('should click "ID" button on the page and validate the header label text', async ({ mrzScannerPage }) => {
    await mrzScannerPage.clickStartButton();
  
    await mrzScannerPage.clickscanIDButton();
    const selectedBtn = await mrzScannerPage.getSelectedButton();
    await expect(selectedBtn).toHaveText('ID');

  });

  test('should click "Passport" button on the page and validate the header label text', async ({ mrzScannerPage }) => {
    await mrzScannerPage.clickStartButton();
    
    await mrzScannerPage.clickscanPassportButton();
    const selectedBtn = await mrzScannerPage.getSelectedButton(); 
    await expect(selectedBtn).toHaveText('Passport');

  });

});
