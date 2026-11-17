import puppeteer from "puppeteer-core";

const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });

try {
  await page.goto(`${BASE}/new`, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await page.goto(`${BASE}/new`, { waitUntil: "networkidle0" });

  // Ensure vocabulary tab
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll("[data-slot='tabs-trigger']")].find(
      (t) => t.textContent?.includes("Vocabulary"),
    );
    tab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));

  const autoLabel = await page.evaluate(() => document.body.innerText);
  if (!autoLabel.includes("Auto (Gemini)")) {
    throw new Error("Expected Auto (Gemini) list picker label");
  }

  await page.type("#name", "serendipity");
  await page.evaluate(() => {
    document
      .querySelector('button[aria-label="Save"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  await page.waitForFunction(
    () =>
      document.body.innerText.includes("VITE_GEMINI_API_KEY") ||
      document.body.innerText.includes("Gemini API key"),
    { timeout: 10000 },
  );

  // Word should not have been created without a category.
  const storage = await page.evaluate(() => localStorage.getItem("app-storage"));
  if (storage?.includes("serendipity")) {
    throw new Error("Word was saved despite categorize failure");
  }

  console.log("SMOKE PASS: missing-key path blocks orphan word");
  process.exitCode = 0;
} catch (err) {
  console.error("SMOKE FAIL:", err);
  console.error(await page.evaluate(() => document.body.innerText).catch(() => ""));
  process.exitCode = 1;
} finally {
  await browser.close();
}
