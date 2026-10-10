const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const w = require(path.join(__dirname, "..", "expense-planner-bot.json"));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "n8n-code-check-"));
let allOk = true;

for (const n of w.nodes) {
  if (n.type !== "n8n-nodes-base.code") continue;
  const wrapped = `(async () => {\nconst items = [];\nconst $ = () => ({ first: () => ({ json: {} }) });\n${n.parameters.jsCode}\n})();`;
  const f = path.join(dir, n.name.replace(/[^a-zA-Z0-9]/g, "_") + ".js");
  fs.writeFileSync(f, wrapped);
  try {
    execFileSync("node", ["--check", f], { stdio: "pipe" });
    console.log("OK  ", n.name);
  } catch (e) {
    allOk = false;
    console.log("FAIL", n.name);
    console.log(e.stderr ? e.stderr.toString().slice(0, 800) : e.message);
  }
}
console.log(allOk ? "ALL CODE NODES PARSE OK" : "SYNTAX ERRORS FOUND");
fs.rmSync(dir, { recursive: true, force: true });
