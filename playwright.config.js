const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  expect: {
    timeout: 7000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
    channel: 'chrome',
    viewport: { width: 1280, height: 800 }
  }
});
