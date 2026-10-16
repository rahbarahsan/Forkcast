/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const localPython = [
  'venv/Scripts/python.exe',
  'venv/bin/python',
  '.venv/Scripts/python.exe',
  '.venv/bin/python',
]
  .map((candidate) => path.resolve('../backend', candidate))
  .find(existsSync);
const python = process.env.FORKCAST_TEST_PYTHON || localPython || 'python';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:8081', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: `"${python}" -m uvicorn main:app --app-dir ../backend --host 127.0.0.1 --port 8000`,
      url: 'http://127.0.0.1:8000/api/health',
      env: {
        FORKCAST_DATABASE: path.resolve(`../data/local/e2e-${Date.now()}.sqlite3`),
        FORKCAST_MODEL_PROVIDER: 'none',
      },
      reuseExistingServer: false,
    },
    {
      command: `"${python}" -m http.server 8081 --bind 127.0.0.1 --directory dist`,
      url: 'http://127.0.0.1:8081',
      reuseExistingServer: false,
    },
  ],
});
