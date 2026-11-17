import puppeteer from "puppeteer-core";

const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  // Fresh profile each run
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });

  const homeText = await page.evaluate(() => document.body.innerText);
  assert(homeText.includes("Formal & Academic"), "Seeded list missing on home");
  assert(homeText.includes("therefore") || homeText.includes("whilst"), "Seeded words missing");
  console.log("OK home seed");

  // Click a list row
  const listClicked = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("Formal & Academic"),
    );
    if (!link) return false;
    link.click();
    return true;
  });
  assert(listClicked, "Could not click Formal & Academic");
  await page.waitForFunction(
    () =>
      location.pathname.includes("/lists/") &&
      document.body.innerText.includes("words saved"),
    { timeout: 10000 },
  );
  const listText = await page.evaluate(() => document.body.innerText);
  assert(listText.includes("words saved"), "List page missing word count");
  assert(listText.includes("Practice"), "List page missing Practice");
  console.log("OK list page", page.url());

  // Open a word via direct navigation for stability
  await page.goto(`${BASE}/lists/formal-academic/therefore`, {
    waitUntil: "networkidle0",
  });
  await page.waitForFunction(
    () => document.body.innerText.includes("Examples of Usage"),
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 1500));
  const wordText = await page.evaluate(() => document.body.innerText);
  assert(wordText.includes("Examples of Usage"), "Word page missing examples panel");
  assert(wordText.includes("therefore"), "Word page missing word title");
  assert(!wordText.includes("Maximum update depth"), "Word page infinite loop");
  console.log("OK word page", page.url());
  console.log("word snippet:", wordText.slice(0, 400).replace(/\n/g, " | "));

  // Create a list
  await page.goto(`${BASE}/new`, { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll("[data-slot='tabs-trigger']")];
    const listTab = tabs.find((t) => t.textContent?.includes("List"));
    listTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.type("#name", "Cloud Test List");
  await page.evaluate(() => {
    const save = document.querySelector('button[aria-label="Save"]');
    save?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForFunction(
    () => document.body.innerText.includes("Cloud Test List") || location.pathname === "/",
    { timeout: 10000 },
  ).catch(() => {});
  await page.goto(BASE, { waitUntil: "networkidle0" });
  const afterCreate = await page.evaluate(() => document.body.innerText);
  assert(afterCreate.includes("Cloud Test List"), "Created list missing on home");
  console.log("OK create list");

  // Persistence
  await page.reload({ waitUntil: "networkidle0" });
  const afterReload = await page.evaluate(() => document.body.innerText);
  assert(afterReload.includes("Cloud Test List"), "Created list lost after reload");
  assert(afterReload.includes("Formal & Academic"), "Seed lost after reload");
  const storage = await page.evaluate(() => localStorage.getItem("app-storage"));
  assert(!!storage, "app-storage missing in localStorage");
  console.log("OK localStorage persistence");

  // Practice
  await page.goto(`${BASE}/practice/formal-academic`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  const practiceText = await page.evaluate(() => document.body.innerText);
  assert(practiceText.includes("Practice") || practiceText.includes("Tap to reveal"), "Practice page failed");
  await page.evaluate(() => {
    const card = document.querySelector("button.flex.min-h-\\[420px\\], button");
    // click the large practice card
    const buttons = [...document.querySelectorAll("button")];
    const practiceCard = buttons.find((b) => b.innerText.includes("Tap to reveal") || b.innerText.length > 5);
    practiceCard?.click();
  });
  await new Promise((r) => setTimeout(r, 300));
  console.log("OK practice page");

  if (errors.length) {
    console.log("Page errors:", errors.slice(0, 10));
  }
  assert(errors.filter((e) => e.includes("Maximum update depth")).length === 0, "Infinite loop errors present");

  console.log("SMOKE PASS");
  process.exitCode = 0;
} catch (err) {
  console.error("SMOKE FAIL:", err);
  console.error("URL:", page.url());
  console.error("Body:", await page.evaluate(() => document.body.innerText).catch(() => ""));
  console.error("Errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
