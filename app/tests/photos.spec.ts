import { expect, test } from '@playwright/test';

test('all reference recipes display local photographs with credits', async ({ page, request }) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  const apiUrl = process.env.FORKCAST_TEST_API_URL || 'http://localhost:8000/api';
  const recipes: { id: string; title: string; image: string; source: string }[] = await (
    await request.get(apiUrl + '/recipes')
  ).json();
  const reference = recipes.filter((recipe) => recipe.source === 'catalog');
  expect(reference).toHaveLength(50);
  expect(reference.every((recipe) => recipe.image.startsWith('recipe-photo:'))).toBe(true);
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore recipes', exact: true }).click();
  await expect(
    page.getByText('SERVING SUGGESTION', { exact: true }).filter({ visible: true }),
  ).toHaveCount(50);
  const photos = page.getByRole('img', { name: /Serving suggestion for / });
  await expect(photos).toHaveCount(50);
  const labels = await photos.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('aria-label') || node.getAttribute('alt') || ''),
  );
  for (const recipe of reference) {
    expect(labels.some((label) => label.endsWith('. Serving suggestion for ' + recipe.title))).toBe(
      true,
    );
  }
  for (let index = 0; index < 50; index += 1) {
    const photo = photos.nth(index);
    await expect(photo).toHaveCount(1);
    await expect
      .poll(() =>
        photo.evaluate((node) => {
          const image = node instanceof HTMLImageElement ? node : node.querySelector('img');
          return {
            loaded: !!image && image.complete && image.naturalWidth >= 480,
            host: image ? new URL(image.currentSrc || image.src).hostname : '',
          };
        }),
      )
      .toEqual({ loaded: true, host: 'localhost' });
  }
  const credits = page.getByRole('link').filter({ hasText: /CC BY|CC0|Public domain/ });
  await expect(credits).toHaveCount(50);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await photos.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('recipe-photos.png') });
  const original = reference[0];
  await page.getByLabel('Search recipes or ingredients', { exact: true }).fill(original.title);
  await page.getByRole('button', { name: 'Edit recipe', exact: true }).click();
  try {
    await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Save recipe', exact: true })).toHaveCount(0);
    const updated: typeof recipes = await (await request.get(apiUrl + '/recipes')).json();
    expect(updated.find((recipe) => recipe.id === original.id)?.image).toBe(original.image);
    await expect(photos).toHaveCount(1);
  } finally {
    // Remove only this test's private override; the shared reference recipe remains.
    await request.delete(apiUrl + '/recipes/' + original.id);
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
