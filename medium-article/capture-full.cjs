const puppeteer = require("puppeteer");
const path = require("path");
(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', "mandavkaratharva@gmail.com");
  await page.type('input[type="password"]', "Atharva@1234");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !location.pathname.includes("login"), {
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 5000));
  for (const [match, name] of [
    ["tax", "taxes-full"],
    ["report", "reports-full"],
    ["expense", "expense-full"],
  ]) {
    await page.evaluate((m) => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        x.textContent.trim().toLowerCase().startsWith(m),
      );
      if (b) b.click();
    }, match);
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({
      path: path.join(__dirname, "assets", name + ".png"),
      fullPage: true,
    });
    console.log(name, "done");
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
