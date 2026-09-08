const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "assets");
fs.mkdirSync(OUT, { recursive: true });

const TABS = [
  ["overview", "tab-overview"],
  ["expense", "tab-expense"],
  ["income", "tab-income"],
  ["budgets", "tab-budgets"],
  ["recurring", "tab-recurring"],
  ["loans", "tab-loans"],
  ["goals", "tab-goals"],
  ["taxes", "tab-taxes"],
  ["reports", "tab-reports"],
  ["household", "tab-household"],
  ["investments", "tab-investments"],
];

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // Login page shot
  await page.goto("http://localhost:3000/login", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT, "login.png") });
  console.log("login.png done");

  // Login
  await page.type('input[type="email"]', "mandavkaratharva@gmail.com");
  await page.type('input[type="password"]', "Atharva@1234");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !location.pathname.includes("login"), {
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 6000)); // let data load

  for (const [key, name] of TABS) {
    try {
      const clicked = await page.evaluate((k) => {
        const btns = [...document.querySelectorAll("button")];
        const b = btns.find((x) =>
          x.textContent
            .trim()
            .toLowerCase()
            .includes(
              k === "expense"
                ? "expense"
                : k
                    .replace("investments", "investment")
                    .replace("household", "family")
                    .replace("taxes", "tax")
                    .replace("recurring", "recurring")
                    .replace("budgets", "budget")
                    .replace("loans", "loan")
                    .replace("goals", "goal")
                    .replace("reports", "report")
                    .replace("income", "income")
                    .replace("overview", "overview"),
            ),
        );
        if (b) {
          b.click();
          return true;
        }
        return false;
      }, key);
      if (!clicked) {
        console.log("no button for", key);
        continue;
      }
      await new Promise((r) => setTimeout(r, 3500));
      await page.screenshot({ path: path.join(OUT, name + ".png") });
      console.log(name + ".png done");
    } catch (e) {
      console.log("fail", key, e.message);
    }
  }

  await browser.close();
  console.log("ALL DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
