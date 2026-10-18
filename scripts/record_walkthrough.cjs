/* Record the real local app with a disposable household. See docs/WALKTHROUGH.md. */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const { chromium } = require(path.join(root, "app/node_modules/playwright"));
const local = path.join(root, "data/local");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = path.join(local, "walkthrough-" + stamp);
fs.mkdirSync(output, { recursive: true });
const python = process.env.FORKCAST_DEMO_PYTHON || "python";
const provider = process.env.FORKCAST_DEMO_PROVIDER || "codex";
const api = "http://localhost:8017/api";
const web = "http://localhost:8087";
const database = path.join(output, "household.sqlite3");
const children = [];
function server(args, name, env = {}) {
  const log = fs.openSync(path.join(output, name + ".log"), "a");
  const child = spawn(python, args, {
    cwd: root,
    windowsHide: true,
    env: { ...process.env, ...env },
    stdio: ["ignore", log, log],
  });
  children.push(child);
  return child;
}
async function ready(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Server did not start: " + url);
}
async function request(route, body) {
  const response = await fetch(
    api + route,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) throw new Error(route + ": " + (await response.text()));
  return response.json();
}
const stage = String.raw`<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#183c2e;color:#f8f7f1;font-family:Arial,sans-serif}
header{height:108px;display:flex;align-items:center;justify-content:space-between;padding:22px 32px;border-bottom:1px solid #45614c}
.brand{font:italic 36px Georgia;margin-bottom:8px}.eyebrow{font-size:10px;letter-spacing:2.5px;color:#ddecaa}
.chapter{text-align:right}.chapter h1{font:32px Georgia;margin:0 0 10px}.chapter p{font-size:15px;margin:0;color:#e6ebdf}
main{height:736px;background:#f8f7f1;display:flex;justify-content:center}
iframe{border:0;width:100%;height:100%;background:#f8f7f1;transition:width .5s}
footer{height:56px;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;font-size:11px;letter-spacing:1.4px}
#number{color:#ddecaa}#progress{position:fixed;bottom:0;left:0;height:3px;background:#ddecaa;width:0;transition:width .5s}
</style></head><body><header><div><div class="brand">forkcast.</div><div class="eyebrow">YOUR EVERYDAY KITCHEN / A PRODUCT WALKTHROUGH</div></div><div class="chapter"><h1 id="title">Good food. Less figuring it out.</h1><p id="caption">50 recipes. One local kitchen. A better week.</p></div></header><main><iframe title="Forkcast application" src="/"></iframe></main><footer><span id="number">01 / 10</span><span id="footnote">EXAMPLE HOUSEHOLD / ALL CHANGES SAVED LOCALLY</span><span>RECIPES / PLAN / PANTRY / SHOP</span></footer><div id="progress"></div></body></html>`;
async function main() {
  // Refuse to attach to an existing server or household.
  for (const url of [api + "/health", web]) {
    let occupied = false;
    try {
      occupied = (await fetch(url)).ok;
    } catch {}
    assert(!occupied, "Recording ports are occupied: " + url);
  }
  server(
    [
      "-m",
      "uvicorn",
      "main:app",
      "--app-dir",
      path.join(root, "backend"),
      "--host",
      "127.0.0.1",
      "--port",
      "8017",
    ],
    "backend",
    {
      FORKCAST_DATABASE: database,
      FORKCAST_ORIGINS: web,
      FORKCAST_MODEL_PROVIDER: provider,
    },
  );
  server(
    [
      "-m",
      "http.server",
      "8087",
      "--bind",
      "127.0.0.1",
      "--directory",
      path.join(local, "walkthrough-dist"),
    ],
    "web",
  );
  let browser, context, page;
  const chapters = [],
    omissions = [],
    errors = [];
  let started = 0;
  try {
    await ready(api + "/health");
    await ready(web);
    // Explicitly fictional flyer entries, never represented as live store prices.
    for (const [name, store, price, quantity, unit] of [
      ["extra virgin olive oil", "Sample Market", 7.49, 500, "ml"],
      ["eggs", "Sample Market", 3.99, 12, "pcs"],
      ["canned chickpeas", "Sample Market", 1.29, 400, "g"],
      ["extra virgin olive oil", "Sample Grocer", 9.49, 500, "ml"],
      ["eggs", "Sample Grocer", 4.99, 12, "pcs"],
    ])
      await request("/offers", {
        name,
        store,
        price,
        quantity,
        unit,
        currency: "CAD",
      });
    const recipes = await request("/recipes");
    assert.equal(recipes.length, 50);
    const videoUrl = "https://www.youtube.com/watch?v=3SlIQtHsToc";
    let videoPreview;
    console.log("Preparing public video source...");
    videoPreview = await request("/import/youtube", {
      url: videoUrl,
      use_model: false,
    });
    fs.writeFileSync(
      path.join(output, "video-source.json"),
      JSON.stringify(videoPreview, null, 2),
    );
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      recordVideo: { dir: output, size: { width: 1440, height: 900 } },
    });
    await context.route(web + "/walkthrough-stage", (route) =>
      route.fulfill({ contentType: "text/html", body: stage }),
    );
    started = Date.now();
    page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(web + "/walkthrough-stage");
    const app = page.frameLocator("iframe");
    const wait = (ms) => page.waitForTimeout(ms);
    const time = () => (Date.now() - started) / 1000;
    async function chapter(
      title,
      caption,
      footnote = "EXAMPLE HOUSEHOLD / ALL CHANGES SAVED LOCALLY",
    ) {
      chapters.push({ start: time(), title, caption });
      console.log("Recording: " + title);
      await page.evaluate(
        ({ title, caption, number, footnote }) => {
          document.getElementById("title").textContent = title;
          document.getElementById("caption").textContent = caption;
          document.getElementById("number").textContent =
            String(number).padStart(2, "0") + " / 10";
          document.getElementById("progress").style.width = number * 10 + "%";
          document.getElementById("footnote").textContent = footnote;
        },
        { title, caption, number: chapters.length, footnote },
      );
      await wait(650);
    }
    async function click(locator) {
      await locator.scrollIntoViewIfNeeded();
      await wait(300);
      await locator.click();
      await wait(450);
    }
    async function type(label, value) {
      const field = app.getByLabel(label, { exact: true });
      await field.scrollIntoViewIfNeeded();
      await field.fill("");
      await field.pressSequentially(value, { delay: 25 });
      await wait(250);
    }
    const button = (name) => app.getByRole("button", { name, exact: true });
    const nav = (name) => click(app.getByRole("tab", { name, exact: true }));
    async function show(locator, ms = 2200) {
      await locator.scrollIntoViewIfNeeded();
      await wait(ms);
    }
    await button("Explore recipes").waitFor();
    await chapter(
      "Good food. Less figuring it out.",
      "A private local kitchen, ready to make the week easier.",
    );
    await wait(3500);
    await show(button("Browse the collection ↗"), 1600);
    await chapter(
      "Find your next favorite.",
      "50 sourced recipes, real photographs and clear halal notes.",
    );
    await click(button("Explore recipes"));
    await type("Search recipes or ingredients", "Shakshuka");
    await show(
      app.getByRole("img", { name: /Serving suggestion for Shakshuka/ }),
      2500,
    );
    await click(button("View recipe details"));
    await show(
      app.getByText(/^Ingredients .*serves /).filter({ visible: true }),
      1500,
    );
    await show(button("Original recipe · The Mediterranean Dish"), 1200);
    await click(button("Close recipe details"));
    await click(button("Select recipe"));
    await type("Search recipes or ingredients", "Hummus");
    await show(
      app.getByRole("img", { name: /Serving suggestion for Hummus/ }),
      2200,
    );
    await click(button("Select recipe"));
    await chapter(
      "Make a plan that fits.",
      "Two dinners together. One plan to shop from.",
    );
    await nav("Planner");
    await type("Plan name", "A brighter week");
    await click(button("Save meal plan"));
    if (await button("Use this plan").isEnabled()) {
      await click(button("Use this plan"));
    }
    await show(
      app.getByText("A brighter week - Active", { exact: true }),
      2500,
    );
    await chapter(
      "Start with what you have.",
      "Real pantry quantities reduce the amounts you need to buy.",
    );
    await nav("Pantry");
    await type("Ingredient name", "extra virgin olive oil");
    await type("Quantity and unit", "100 ml");
    await click(button("Add pantry item"));
    await type("Ingredient name", "garlic");
    await type("Quantity and unit", "2 cloves");
    await click(button("Add pantry item"));
    await show(app.getByText("100 ml", { exact: true }), 1800);
    await chapter(
      "One sensible shopping list.",
      "Grouped by aisle, with pantry deductions and recipe evidence.",
    );
    await nav("Groceries");
    await app.getByText("Already in your pantry", { exact: true }).waitFor();
    await show(app.getByText("Already in your pantry", { exact: true }), 2500);
    const check = app.getByRole("checkbox").first();
    await show(check, 1800);
    await click(check);
    const evidence = app
      .getByRole("button", { name: /^Recipe evidence for / })
      .first();
    await click(evidence);
    await wait(1700);
    await click(evidence);
    const insight = app.getByRole("button", { name: /^Insights for / }).first();
    await click(insight);
    await show(button("Close ingredient insights"), 1700);
    await click(button("Close ingredient insights"));
    const download = page.waitForEvent("download");
    await click(button("Export grocery list"));
    assert.equal(
      (await download).suggestedFilename(),
      "forkcast-groceries.txt",
    );
    await click(button("Save to history"));
    await nav("History");
    await show(
      app
        .getByText("A brighter week", { exact: true })
        .filter({ visible: true }),
      2000,
    );
    await chapter(
      "Give your basket a destination.",
      "Compare whole-pack costs and see what still has no price.",
      "ILLUSTRATIVE OFFERS / FICTIONAL STORES / NOT LIVE PRICES",
    );
    await nav("Tools");
    await click(button("Compare recorded offers"));
    await show(
      app.getByText(/priced subtotal$/).filter({ visible: true }),
      2600,
    );
    await nav("Groceries");
    await click(button("Suggest stores from my offers"));
    await show(app.getByText(/Best recorded coverage:/), 2300);
    await chapter(
      "From watchlist to table.",
      "Import a YouTube recipe, then check its source and amounts.",
      "PUBLIC VIDEO SOURCE / REVIEW BEFORE SAVING",
    );
    await nav("Discover");
    await click(button("Import from YouTube"));
    await type("YouTube video URL", videoUrl);
    if (videoPreview.text) {
      // Pasted source is the actual public description, not a fabricated transcript.
      await app
        .getByLabel("Video transcript or description (optional fallback)", {
          exact: true,
        })
        .fill(videoPreview.text);
      await page.evaluate(
        () =>
          (document.getElementById("caption").textContent =
            "Review the real video description before saving an interpreted recipe."),
      );
    }
    await click(button("Fetch video recipe"));
    const begin = time();
    await app
      .getByLabel("Recipe title", { exact: true })
      .waitFor({ timeout: 180000 });
    const end = time();
    if (end - begin > 3)
      omissions.push({
        start: begin + 0.4,
        end: end - 0.4,
        reason: "Video/model response wait shortened",
      });
    await show(
      app.getByText(
        "Recipe loaded into the editor below. Check the quantities, then choose Save recipe.",
        { exact: true },
      ),
      1800,
    );
    await show(app.getByLabel("Recipe title", { exact: true }), 2200);
    await click(button("Cancel editing"));
    await chapter(
      "A second pair of hands.",
      "Ask, review the prepared action, then choose Apply.",
      "LIVE SUBSCRIPTION MODEL / RESPONSE WAIT SHORTENED",
    );
    await nav("Assistant");
    if (provider !== "none") {
      await type(
        "Message your kitchen assistant",
        "Add 500 g basmati rice and 4 eggs to my pantry.",
      );
      await click(button("Send message"));
      const begin = time();
      await app
        .getByText("Review changes", { exact: true })
        .waitFor({ timeout: 180000 });
      const end = time();
      if (end - begin > 3)
        omissions.push({
          start: begin + 0.4,
          end: end - 0.4,
          reason: "Assistant response wait shortened",
        });
      await show(app.getByText("Review changes", { exact: true }), 1800);
      await show(button("Apply prepared changes"), 2200);
      await click(button("Apply prepared changes"));
      await app.getByText("applied", { exact: true }).waitFor();
      await wait(1700);
      await nav("Pantry");
      await show(app.getByText("basmati rice", { exact: true }), 1600);
    } else {
      await click(button("Model settings"));
      await wait(2200);
    }
    await chapter(
      "Your kitchen travels with you.",
      "The same local household, in a compact phone layout.",
    );
    await page.evaluate(
      () => (document.querySelector("iframe").style.width = "390px"),
    );
    await wait(900);
    await nav("Home");
    await wait(2100);
    await nav("Discover");
    await type("Search recipes or ingredients", "Shakshuka");
    await show(
      app.getByRole("img", { name: /Serving suggestion for Shakshuka/ }),
      2500,
    );
    await chapter(
      "A little planning. More living.",
      "Recipes. Pantry. Plans. Groceries. All in your own little kitchen.",
    );
    await page.evaluate(
      () => (document.querySelector("iframe").style.width = "100%"),
    );
    await wait(700);
    await nav("Home");
    await show(app.getByRole("heading", { name: /Good food/ }), 3200);
    assert.deepEqual(errors, []);
    const pantry = await request("/pantry");
    if (provider !== "none")
      assert(pantry.some((item) => item.name === "basmati rice"));
    await page.screenshot({ path: path.join(output, "poster.png") });
    const video = page.video();
    await context.close();
    context = null;
    const source = await video.path();
    const manifest = {
      source,
      chapters,
      omissions,
      provider,
      database,
      recorded_on: new Date().toISOString(),
      duration: time(),
      assertions:
        "real API writes, exported grocery file, assistant Apply, no browser errors",
    };
    fs.writeFileSync(
      path.join(output, "capture.json"),
      JSON.stringify(manifest, null, 2),
    );
    fs.writeFileSync(
      path.join(local, "walkthrough-latest.json"),
      JSON.stringify({ output, ...manifest }, null, 2),
    );
    console.log("CAPTURE COMPLETE " + output);
  } catch (error) {
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png") })
        .catch(() => {});
    throw error;
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    for (const child of children) child.kill();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
