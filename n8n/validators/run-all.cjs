// Runs the full n8n workflow validation suite:
//   node n8n/validators/run-all.cjs
// 1. Structural graph validation (orphans, connections, expression references)
// 2. Switch-output -> target wiring (catches off-by-one routing bugs)
// 3. Code-node syntax (all embedded scripts must parse)
// 4. Query/parameter expression safety (no n8n-parser-hostile syntax)
// 5. Functional logic tests (command parsing, builders, guards, escaping)
const { execFileSync } = require("child_process");
const path = require("path");

const validators = [
  "validate-workflow.cjs",
  "check-switch-wiring.cjs",
  "check-code-nodes.cjs",
  "check-expressions.cjs",
  "test-bot-logic.cjs",
];

let failed = 0;
for (const v of validators) {
  console.log(`\n===== ${v} =====`);
  try {
    execFileSync("node", [path.join(__dirname, v)], { stdio: "inherit" });
  } catch (e) {
    failed++;
    console.error(`FAILED: ${v}`);
  }
}

console.log(`\n${failed === 0 ? "ALL WORKFLOW VALIDATORS PASSED" : failed + " VALIDATOR(S) FAILED"}`);
process.exit(failed ? 1 : 0);
