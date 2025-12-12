import { chromium, type FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * Auth state caching is disabled because Supabase sessions expire very quickly.
 * Always perform fresh login to ensure reliable authentication.
 */
function isAuthStateValid(): boolean {
  return false;
}

/**
 * Wait for the server to be ready
 */
async function waitForServer(url: string, timeout = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 302) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

async function globalSetup(config: FullConfig) {
  // Skip if auth state is still valid
  if (isAuthStateValid()) {
    console.log('Using existing auth state');
    return;
  }

  const { baseURL } = config.projects[0].use;
  
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_USER_EMAIL and E2E_USER_PASSWORD environment variables must be set.\n' +
      'Add them to your .env.test file.'
    );
  }

  console.log(`Logging in with email: ${email}`);

  // Wait for server to be ready
  console.log(`Waiting for server at ${baseURL}...`);
  await waitForServer(`${baseURL}/login`);
  console.log('Server is ready');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to login page and wait for full load
  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

  // Wait for form to be ready and hydrated
  const emailInput = page.getByTestId('login-email-input');
  const passwordInput = page.getByTestId('login-password-input');
  const submitButton = page.getByTestId('login-submit-button');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

  // Small delay to ensure React hydration is complete
  await page.waitForTimeout(500);

  // Fill email and password with click to focus first
  await emailInput.click();
  await emailInput.fill(email);
  await passwordInput.click();
  await passwordInput.fill(password);
  
  // Verify values were filled
  const emailValue = await emailInput.inputValue();
  const passwordValue = await passwordInput.inputValue();
  if (emailValue !== email || passwordValue !== password) {
    console.error(`Fill verification failed. Email: "${emailValue}", Password length: ${passwordValue.length}`);
    await page.screenshot({ path: 'e2e/.auth/fill-error.png' });
    throw new Error('Failed to fill login form');
  }

  // Click Sign In and wait for redirect
  await submitButton.click();
  
  // Wait for navigation to dashboard
  try {
    await page.waitForURL(`${baseURL}/`, { timeout: 30000 });
  } catch {
    // If navigation failed, check for error message
    const errorElement = page.locator('.bg-destructive\\/15');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      await page.screenshot({ path: 'e2e/.auth/login-error.png' });
      throw new Error(`Login failed: ${errorText}`);
    }
    await page.screenshot({ path: 'e2e/.auth/login-timeout.png' });
    throw new Error('Login timed out without error message');
  }

  // Wait for dashboard to load (verify we're logged in)
  await page.getByTestId('add-entry-button').waitFor({ state: 'visible', timeout: 10000 });

  // Save authentication state
  await context.storageState({ path: AUTH_FILE });
  console.log('Auth state saved');

  await browser.close();
}

export default globalSetup;

