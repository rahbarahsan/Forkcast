import { expect, test } from '@playwright/test';

test('switching providers refreshes recipe extraction without reloading', async ({ page }) => {
  let enabled = false;
  await page.route('**/api/models/config', async (route) => {
    if (route.request().method() === 'PUT') enabled = true;
    await route.fulfill({
      json: {
        provider: enabled ? 'codex' : 'none',
        model: 'CLI default',
        available: enabled,
        image_supported: enabled,
        environment_managed: false,
        choices: [
          { provider: 'none', ready: true },
          { provider: 'codex', ready: true },
        ],
      },
    });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Discover', exact: true }).click();
  await page.getByLabel('Extraction text (recipe)', { exact: true }).fill('A recipe transcript');
  await expect(
    page.getByRole('button', { name: 'Extract for review', exact: true }),
  ).toBeDisabled();
  await page.getByRole('tab', { name: 'Assistant', exact: true }).click();
  await page.getByRole('button', { name: 'Model settings', exact: true }).click();
  await page.getByRole('button', { name: 'Use codex', exact: true }).click();
  await expect(page.getByText('Connected through codex.', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Extract for review', exact: true })).toBeEnabled();
});

test('YouTube fallback previews a sourced recipe without saving it', async ({ page, request }) => {
  const before = await (await request.get('http://localhost:8000/api/recipes')).json();
  await page.goto('/');
  await page.getByRole('tab', { name: 'Discover', exact: true }).click();
  await page.getByRole('button', { name: 'Import from YouTube', exact: true }).click();
  await page.getByLabel('YouTube video URL', { exact: true }).fill('https://youtu.be/abcDEF123_-');
  await page
    .getByLabel('Video transcript or description (optional fallback)', { exact: true })
    .fill(
      'Video lemon rice\nIngredients:\n200 g rice\n1 lemon\nInstructions:\nCook rice and stir in lemon.',
    );
  await page.getByRole('button', { name: 'Fetch video recipe', exact: true }).click();
  await expect(page.getByLabel('Recipe title', { exact: true })).toHaveValue('Video lemon rice');
  await expect(page.getByText(/not verified against the video/)).toBeVisible();
  expect((await (await request.get('http://localhost:8000/api/recipes')).json()).length).toBe(
    before.length,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('video-preview.png') });
});

test('chat changes require Apply and show the resulting kitchen state', async ({
  page,
  request,
}) => {
  // Model-dependent responses are fixtures. SQLite writes and household refresh
  // use the real local API; graph execution/apply semantics have backend tests.
  const name = 'Assistant rice ' + test.info().project.name;
  const conversation = {
    id: 'browser-conversation',
    messages: [
      { role: 'user', text: 'Add rice to my pantry' },
      {
        role: 'assistant',
        text: 'I prepared a pantry update for review.',
        task_id: 'browser-task',
        status: 'pending',
        writes: [{ kind: 'pantry', data: { name, quantity: '500 g' } }],
        results: [],
      },
    ],
  };
  let saved = false;
  await page.route('**/api/chat', (route) => route.fulfill({ json: conversation }));
  await page.route('**/api/conversations', (route) => route.fulfill({ json: [conversation] }));
  await page.route('**/api/tasks/browser-task/apply', async (route) => {
    if (!saved) {
      const response = await request.post('http://localhost:8000/api/pantry', {
        data: { name, quantity: '500 g' },
      });
      expect(response.ok()).toBe(true);
      saved = true;
      conversation.messages[1].status = 'applied';
    }
    await route.fulfill({ json: { status: 'applied' } });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Assistant', exact: true }).click();
  await page
    .getByLabel('Message your kitchen assistant', { exact: true })
    .fill('Add rice to my pantry');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByText('Review changes', { exact: true })).toBeVisible();
  const before = await (await request.get('http://localhost:8000/api/pantry')).json();
  expect(before.some((item: { name: string }) => item.name === name)).toBe(false);
  await page.getByRole('button', { name: 'Apply prepared changes', exact: true }).click();
  await expect(page.getByText('applied', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Apply prepared changes', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Pantry', exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('store search presents sourced listings without claiming stock or halal certification', async ({
  page,
}) => {
  await page.route('**/api/stores/search', (route) =>
    route.fulfill({
      json: {
        location: 'Toronto, Canada',
        source: 'OpenStreetMap contributors',
        fetched_at: '2026-10-16T12:00:00Z',
        note: 'Map listings do not establish stock, prices or halal certification.',
        stores: [
          {
            id: 'node/42',
            name: 'Fixture grocery',
            distance_km: 0.8,
            address: 'Test Street',
            halal: 'unknown',
            url: 'https://www.openstreetmap.org/node/42',
            directions_url: 'https://www.google.com/maps/dir/?api=1',
          },
        ],
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('tab', { name: 'Groceries', exact: true }).click();
  await page.getByLabel('City and country or postal code', { exact: true }).fill('Toronto, Canada');
  await page.getByRole('button', { name: 'Find nearby grocery stores', exact: true }).click();
  await expect(page.getByText('Fixture grocery', { exact: true })).toBeVisible();
  await expect(page.getByText(/Halal map tag: unknown/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Directions to Fixture grocery', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('store-search.png') });
});
