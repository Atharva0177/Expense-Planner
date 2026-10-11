const path = require('path');
// Verifies no parameter still contains the tournament-hostile nested-object
// expressions, validates the static Query JSONs, and simulates placeholder
// substitution + the shape of expressions that remain.
const w = require(path.join(__dirname, "..", "expense-planner-bot.json"));
let bad = 0;

for (const n of w.nodes) {
  for (const [k, v] of Object.entries(n.parameters || {})) {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    // any remaining expression with an object literal is a red flag
    const exprs = s.match(/\{\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/g) || [];
    for (const e of exprs) {
      const inner = e.slice(2, -2).trim();
      if (inner.startsWith("JSON.stringify")) {
        console.log("BAD nested-object expression in", n.name, "->", k);
        bad++;
      }
      // allowed shapes: simple member/chain/array-of-scalars/$()-accesses
      const ok =
        /^\$\(\s*'[^']+'\s*\)\.first\(\)\.json(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(inner.replace(/\s+/g, " ")) ||
        /^\$json(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(inner) ||
        /^\[\s*\$json\.[A-Za-z_$][A-Za-z0-9_$]*(\s*,\s*('[^']*'|\d+|true|false|null)\s*)*\]$/.test(inner);
      if (!ok) {
        console.log("REVIEW expression in", n.name, "->", k, "::", inner.slice(0, 90));
      }
    }
  }
}

// validate the 6 static Query JSONs + simulate $n substitution like n8n does
const fsNodes = w.nodes.filter((n) => n.type === "n8n-nodes-base.googleFirebaseCloudFirestore");
for (const n of fsNodes) {
  if (n.parameters.operation !== "query") continue;
  const q = JSON.parse(n.parameters.query); // must be valid JSON
  const paramsExpr = n.parameters.queryParameters;
  const m = paramsExpr.match(/^=?\{\{\s*\[(.*)\]\s*\}\}$/);
  if (!m) { console.log("BAD queryParameters expr on", n.name, "::", paramsExpr); bad++; continue; }
  // Each array element must be one of: $json.<f> [|| 'lit'], $('Node').first().json.<f> [|| 'lit'], or 'lit'
  const inner = m[1].trim();
  const tokenRe = /^\$json\.[A-Za-z_][A-Za-z0-9_]*(\s*\|\|\s*'[^']*')?$|^\$\('[^']+'\)\.first\(\)\.json\.[A-Za-z_][A-Za-z0-9_]*(\s*\|\|\s*'[^']*')?$|^'[^']*'$/;
  if (inner !== "" && !inner.split(",").every((t) => tokenRe.test(t.trim()))) {
    console.log("BAD queryParameters tokens on", n.name, "::", inner); bad++; continue;
  }
  // simulate resolution
  const sim = { userId: "telegram_123", month: "2026-10", inviteCode: "ABC123", qValue: "hh-1", qField: "household_id" };
  const resolve = (t) => {
    t = t.trim();
    let lit = t.match(/'([^']*)'$/);
    let fallback = lit ? lit[1] : "";
    let field = t.match(/\.(json\.)?([A-Za-z_][A-Za-z0-9_]*)/);
    let value = field ? sim[field[2]] : undefined;
    return value !== undefined && value !== null ? value : fallback;
  };
  const params = inner === "" ? [] : inner.split(",").map(resolve);
  const resolved = JSON.parse(JSON.stringify(q), (k2, v2) =>
    typeof v2 === "string" && /^\$\d+$/.test(v2) ? params[Number(v2.slice(1)) - 1] : v2
  );
  const filters = resolved.structuredQuery.where.compositeFilter.filters;
  const vals = JSON.stringify(filters.map((f) => f.fieldFilter.value));
  const hasPlaceholder = JSON.stringify(resolved).includes("$1") || JSON.stringify(resolved).includes("$2");
  if (hasPlaceholder) { console.log("BAD unresolved placeholder on", n.name); bad++; }
  console.log("OK", n.name, "->", vals);
}

// writer nodes (HTTP Request -> Firestore REST) must use the prebuilt typed body
for (const n of w.nodes.filter((n) => n.type === "n8n-nodes-base.httpRequest" && ["Create Transaction", "Create Income Entry"].includes(n.name))) {
  const coll = n.name === "Create Transaction" ? "transactions" : "income_entries";
  const urlOk =
    n.parameters.url.startsWith("=https://firestore.googleapis.com/v1/projects/") &&
    n.parameters.url.includes(`/documents/${coll}?documentId={{ $json.docId }}`);
  const bodyOk = n.parameters.jsonBody === "={{ $json.firestoreBody }}";
  const authOk = n.parameters.authentication === "predefinedCredentialType" && n.parameters.nodeCredentialType === "googleApi";
  if (urlOk && bodyOk && authOk) console.log("OK", n.name, "-> Firestore REST writer");
  else { console.log("BAD writer node", n.name, { urlOk, bodyOk, authOk }); bad++; }
}

// receipt photo writer: same REST shape, photo body, error-tolerant
{
  const n = w.nodes.find((x) => x.name === "Write Receipt Photo");
  if (!n) { console.log("BAD: Write Receipt Photo node missing"); bad++; }
  else {
    const urlOk =
      n.parameters.url.startsWith("=https://firestore.googleapis.com/v1/projects/") &&
      n.parameters.url.includes("/documents/receipt_photos?documentId={{ $json.docId }}");
    const bodyOk = n.parameters.jsonBody === "={{ $json.photoFirestoreBody }}";
    const authOk = n.parameters.authentication === "predefinedCredentialType" && n.parameters.nodeCredentialType === "googleApi";
    const errOk = n.onError === "continueRegularOutput";
    if (urlOk && bodyOk && authOk && errOk) console.log("OK Write Receipt Photo -> Firestore REST photo writer (error-tolerant)");
    else { console.log("BAD Write Receipt Photo", { urlOk, bodyOk, authOk, errOk }); bad++; }
  }
}

// receipt photo cleanup on /undo: deletes receipt_photos/{txId}, 404 tolerated
{
  const n = w.nodes.find((x) => x.name === "Delete Receipt Photo");
  if (!n) { console.log("BAD: Delete Receipt Photo node missing"); bad++; }
  else {
    const urlOk =
      n.parameters.method === "DELETE" &&
      n.parameters.url.includes("/documents/receipt_photos/{{ $('Build Undo').first().json.deleteDocId }}");
    const errOk = n.onError === "continueRegularOutput";
    if (urlOk && errOk) console.log("OK Delete Receipt Photo -> receipt_photos/{txId} cleanup (404 tolerated)");
    else { console.log("BAD Delete Receipt Photo", { urlOk, errOk }); bad++; }
  }
}

// Build Transaction must flag has_receipt_photo and mirror the website's
// receipt_photos schema when a photo rides along
{
  const code = w.nodes.find((n) => n.name === "Build Transaction").parameters.jsCode;
  const need = [
    "has_receipt_photo: { booleanValue: !!photoData }",
    "photoFirestoreBody = JSON.stringify({ fields: {",
    "size: { integerValue: String(photoData.length) }",
    "$('Read Callback').first().json",
  ];
  for (const s of need) {
    if (!code.includes(s)) { console.log("BAD Build Transaction missing:", s); bad++; }
  }
  if (w.nodes.find((n) => n.name === "Finalize Transaction").parameters.jsCode.includes("$('Build Transaction').first().json")) {
    console.log("OK Finalize Transaction -> restores Build Transaction payload");
  } else { console.log("BAD Finalize Transaction passthrough"); bad++; }
  const conf = w.nodes.find((n) => n.name === "Build Scan Confirmation").parameters.jsCode;
  if (conf.includes("imageBase64.length <= 800000") && conf.includes("photoData, photoMime };")) {
    console.log("OK Build Scan Confirmation -> parks photo (800k budget)");
  } else { console.log("BAD Build Scan Confirmation photo parking"); bad++; }
}

// Gemini Scan must reference the prebuilt body
const gemini = w.nodes.find((n) => n.name === "Gemini Scan");
if (gemini.parameters.jsonBody !== "={{ $('Extract Image').first().json.geminiBody }}") { console.log("BAD gemini jsonBody"); bad++; }
else console.log("OK Gemini Scan -> jsonBody references Extract Image explicitly");

console.log(bad === 0 ? "\nALL EXPRESSION/QUERY CHECKS PASSED" : "\nFAILURES: " + bad);
process.exit(bad ? 1 : 0);
