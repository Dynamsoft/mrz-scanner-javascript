import { test as baseTest } from '@playwright/test';
import { MRZScannerPage } from './pages/MRZScannerPage';

type MyFixtures = {
  mrzScannerPage: MRZScannerPage;
};

export const test = baseTest.extend<MyFixtures>({
  
  mrzScannerPage: async ({ page }, use) => {
    const mrzScannerPage = new MRZScannerPage(page);
    await use(mrzScannerPage);
  },
  
});

export { expect } from '@playwright/test';
