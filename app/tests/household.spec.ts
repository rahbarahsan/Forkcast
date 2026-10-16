import { expect, test } from '@playwright/test';

test('a household can plan, shop, export, and reload without external services', async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/');
  await page.screenshot({path:test.info().outputPath('home.png'),fullPage:true});
  await page.getByRole('button', { name: 'Explore recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe', exact: true }).click();
  const title = `Browser dinner ${test.info().project.name}`;
  const planName=title+" plan";
  await page.getByLabel('Recipe title', { exact: true }).fill(title);
  await page
    .getByLabel('Ingredients (one per line)', { exact: true })
    .fill('500 g rice\n2 cloves garlic');
  await page.getByLabel('Instructions', { exact: true }).fill('Cook rice and garlic.');
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await page.getByLabel('Search recipes or ingredients', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Select recipe', exact: true }).click();
  await page.getByRole('link', { name: /Planner/ }).click();
  await page.getByLabel('Plan name', { exact: true }).fill(planName);
  await page.getByRole('button', { name: 'Save meal plan', exact: true }).click();
  await expect(page.getByText(new RegExp('^'+planName+'(?: - Active)?$')).filter({visible:true})).toBeVisible();
  const activate = page.getByRole('button', { name: 'Use this plan', exact: true }).last();
  if (await activate.isEnabled()) await activate.click();
  await page.getByRole('link', { name: /Pantry/ }).click();
  await page.getByLabel('Ingredient name', { exact: true }).fill('garlic');
  await page.getByRole('button', { name: 'Add pantry item', exact: true }).click();
  await page.getByRole('link', { name: /Groceries/ }).click();
  await expect(page.getByRole('checkbox', { name: /rice.*500 g/ })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /garlic/ })).toHaveCount(0);
  await page.getByRole('checkbox', { name: /rice.*500 g/ }).click();
  await expect(page.getByText(/1\/1 collected/)).toBeVisible();
  await page.getByRole('button', {name:'Insights for rice',exact:true}).click();
  await expect(page.getByText('Ingredient: rice', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Close ingredient insights',exact:true}).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export grocery list', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('forkcast-groceries.txt');
  await page.getByRole('button', { name: 'Save to history', exact: true }).click();
  await page.getByRole('link', { name: /History/ }).click();
  await expect(page.getByText(planName, { exact: true }).filter({visible:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath('history.png'),fullPage:true});
  await page.reload();
  await page.getByRole('link', { name: /History/ }).click();
  await expect(page.getByText(planName, { exact: true }).filter({visible:true})).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('review pantry text and record a comparable flyer offer', async ({page,request})=>{
  const recipe=await request.post('http://localhost:8000/api/recipes',{data:{title:'Flyer test rice',ingredients:['500 g rice'],instructions:'Cook rice.'}});
  const saved=await recipe.json();
  await request.post('http://localhost:8000/api/plans',{data:{name:'Flyer test plan',recipeIds:[saved.id],isActive:true}});
  await page.goto('/');
  await page.getByRole('link',{name:/Pantry/}).click();
  await page.getByLabel('Pantry scan text',{exact:true}).fill('2 kg flour');
  await page.getByRole('button',{name:'Preview pantry scan',exact:true}).click();
  await expect(page.getByLabel('Scanned ingredient 1',{exact:true})).toHaveValue('flour');
  await page.getByRole('button',{name:'Add reviewed pantry items',exact:true}).click();
  await expect(page.getByText('flour',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:/Tools/}).click();
  await page.getByLabel('Offer ingredient',{exact:true}).fill('rice');
  await page.getByLabel('Store',{exact:true}).fill('Local market');
  await page.getByLabel('Pack price',{exact:true}).fill('3.00');
  await page.getByLabel('Pack quantity',{exact:true}).fill('1');
  await page.getByRole('button',{name:'kg',exact:true}).click();
  await page.getByRole('button',{name:'Save offer',exact:true}).click();
  await page.getByRole('button',{name:'Compare recorded offers',exact:true}).click();
  await expect(page.getByText('CAD 3.00 priced subtotal',{exact:true})).toBeVisible();
});
