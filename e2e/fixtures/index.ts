import { test as baseTest } from "@playwright/test";
import { MRZScannerPage } from "./MRZScanner.fixture";

export const test = baseTest.extend<{
  mrzScannerPage: MRZScannerPage;
}>({
  mrzScannerPage: async ({ page }, use) => {
    const mrzScannerPage = new MRZScannerPage(page);
    await use(mrzScannerPage);
  },
});

export { expect } from "@playwright/test";
