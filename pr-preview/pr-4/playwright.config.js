import { defineConfig, devices } from "@playwright/test";
import * as path from "path";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    /* Enable headless mode by default */
    headless: true, // Change to `false` to see the browser during testing
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--disable-web-security",
            "--enable-web-rtc",
            "--headless=chrome", // Comment to see the browser during testing
            "--use-fake-device-for-media-stream",
            // "--use-fake-ui-for-media-stream",
            `--use-file-for-fake-video-capture=${path.join(__dirname, "./e2e/assets/sample.y4m")}`,
          ],
        },
        contextOptions: {
          /* Camera permission */
          permissions: ["camera"],
          ignoreHTTPSErrors: true,
        },
      },
    },
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     launchOptions: {
    //       "devtools": true,
    //       "headless": true,
    //       args: [
    //         "--use-fake-device-for-media-stream",
    //         "--use-fake-ui-for-media-stream",
    //         "--headless=firefox",
    //         "--disable-web-security",
    //         "--enable-web-rtc"],
    //       firefoxUserPrefs: {
    //         "permissions.default.camera": 1, // Allow camera access automatically
    //         "media.navigator.streams.fake": true, // Use fake streams if needed
    //         "devtools.debugger.remote-enabled": true,
    //         "devtools.debugger.prompt-connection": false,
    //         "devtools.chrome.enabled": true,
    //         "datareporting.policy.firstRunURL": ""
    //       },
    //     },
    //   },
    // },
    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //     launchOptions: {
    //       args: ["--disable-web-security", "--enable-web-rtc"],
    //     },
    //   },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run start",
  },
});