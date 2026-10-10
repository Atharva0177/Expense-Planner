const path = require('path');
const w = require(path.join(__dirname, "..", "expense-planner-bot.json"));
console.log("valid JSON; nodes:", w.nodes.length, "; name:", w.name);
const names = w.nodes.map((n) => n.name);
console.log("unique names:", new Set(names).size === names.length);
console.log("unique ids:", new Set(w.nodes.map((n) => n.id)).size === w.nodes.length);
let bad = [];
for (const [src, outs] of Object.entries(w.connections)) {
  if (!names.includes(src)) bad.push("source missing: " + src);
  for (const main of outs.main) {
    for (const c of main || []) {
      if (!names.includes(c.node)) bad.push(src + "->" + c.node);
    }
  }
}
console.log("bad connection refs:", bad.length === 0 ? "none" : bad.join(","));
// every non-trigger node must be reachable
const reachable = new Set();
const visit = (n) => {
  if (reachable.has(n)) return;
  reachable.add(n);
  const outs = w.connections[n];
  if (!outs) return;
  for (const main of outs.main) for (const c of main || []) visit(c.node);
};
visit("Telegram Trigger");
visit("Daily 9AM"); // second entry point: the recurring-processor schedule trigger
const orphan = names.filter((n) => !reachable.has(n));
console.log("orphan nodes:", orphan.length === 0 ? "none" : orphan.join(","));
// expression sanity: $() references must point to existing node names
for (const n of w.nodes) {
  const s = JSON.stringify(n.parameters || {});
  const refs = s.match(/\$\('([^']+)'\)/g) || [];
  for (const r of refs) {
    const nm = r.slice(3, -2);
    if (!names.includes(nm)) console.log("BAD $() ref in", n.name, "->", nm);
  }
}
// node type/version inventory
for (const n of w.nodes) console.log(` ${n.type} v${n.typeVersion} :: ${n.name}`);
