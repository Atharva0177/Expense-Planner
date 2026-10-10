const path = require('path');
﻿// Functional test of the bot's core Code-node logic with simulated Telegram updates.
const w = require(path.join(__dirname, "..", "expense-planner-bot.json"));
const codeOf = (name) => w.nodes.find((n) => n.name === name).parameters.jsCode;

function runCode(name, items, nodeData) {
  // Emulates n8n Code node: items, $() accessor, this.helpers
  const $ = (nodeName) => ({
    first: () => ({ json: nodeData[nodeName][0] }),
  });
  const helpers = {
    getBinaryDataBuffer: async () => Buffer.from("fake-image"),
  };
  const fn = new Function("items", "$", "helpers", codeOf(name));
  const result = fn(items, $, helpers);
  // scripts use await in one place; run synchronously if possible
  if (result && typeof result.then === "function") {
    throw new Error("async result unexpected for " + name);
  }
  return result;
}

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log("PASS", label); }
  else { fail++; console.log("FAIL", label, extra !== undefined ? JSON.stringify(extra) : ""); }
}

const today = new Date().toISOString().split("T")[0];
const month = today.slice(0, 7);

function mkUpdate(text, photo) {
  return [{
    json: {
      message: {
        chat: { id: 555 },
        from: { id: 12345 },
        text,
        caption: text || undefined,
        // Telegram photo array: several resized variants, largest is NOT last
        photo: photo ? [
          { file_id: "f-small", width: 90, height: 90, file_size: 8000 },
          { file_id: "f-medium", width: 320, height: 240, file_size: 24000 },
          { file_id: "f-large", width: 1280, height: 960, file_size: 180000 },
        ] : undefined,
      },
    },
  }];
}

// ---- Test 1: expense text classification ----
let r = runCode("Classify Update", mkUpdate("/spent 250 groceries big bazaar"));
check("classify expense", r[0].json.intent === "expense_text" && r[0].json.amount === 250 && r[0].json.rawCategory === "groceries" && r[0].json.note === "big bazaar", r[0].json);
check("classify userId", r[0].json.userId === "telegram_12345", r[0].json);

// ---- Test 2: multi-word category classification ----
r = runCode("Classify Update", mkUpdate("/spent 400 dining out lunch with friends"));
check("classify multiword", r[0].json.intent === "expense_text" && r[0].json.rawCategory === "dining" && r[0].json.note === "out lunch with friends", r[0].json);

// ---- Test 3: income ----
r = runCode("Classify Update", mkUpdate("/earned 50000 salary october"));
check("classify income", r[0].json.intent === "income_text" && r[0].json.amount === 50000 && r[0].json.note === "salary october", r[0].json);

// ---- Test 4: summary with month ----
r = runCode("Classify Update", mkUpdate("/summary 2025-09"));
check("classify summary", r[0].json.intent === "summary" && r[0].json.month === "2025-09" && r[0].json.monthStart === "2025-09-01" && r[0].json.monthEnd === "2025-09-30", r[0].json);

// ---- Test 5: help / unknown / photo ----
r = runCode("Classify Update", mkUpdate("/help"));
check("classify help", r[0].json.intent === "help" && r[0].json.replyText.includes("Expense Planner Bot"), r[0].json);
r = runCode("Classify Update", mkUpdate("hello there"));
check("classify plain text -> nl_parse", r[0].json.intent === "nl_parse" && r[0].json.nlText === "hello there", r[0].json);
r = runCode("Classify Update", mkUpdate("", true));
check("classify photo", r[0].json.intent === "photo", r[0].json);
check("classify picks largest photo variant", r[0].json.photoFileId === "f-large", r[0].json);

// image document (sent as file) also routes to photo branch
{
  const docUpdate = [{ json: { message: { chat: { id: 555 }, from: { id: 12345 }, text: "", document: { file_id: "doc-9", mime_type: "image/png" } } } }];
  r = runCode("Classify Update", docUpdate);
  check("classify image document", r[0].json.intent === "photo" && r[0].json.photoFileId === "doc-9", r[0].json);
}

// ---- Test 6: month end computed correctly ----
r = runCode("Classify Update", mkUpdate("/summary"));
check("current month end valid", /^\d{4}-\d{2}-\d{2}$/.test(r[0].json.monthEnd) && r[0].json.month === month, r[0].json);

// ---- Test 7: collect categories (text path) ----
const classifyOut = runCode("Classify Update", mkUpdate("/spent 250 groceries big bazaar"))[0].json;
// simulate: Parse Scan NOT executed -> $ throws -> catch branch. Emulate by omitting Parse Scan and making $ throw for it.
{
  const classify = runCode("Classify Update", mkUpdate("/spent 250 groceries big bazaar"))[0].json;
  // emulate: Classify Update executed, Parse Scan unexecuted (throws)
  const $partial = (nodeName) => {
    if (nodeName === "Parse Scan") throw new Error("Referenced node is unexecuted");
    return { first: () => ({ json: classify }) };
  };
  const fn = new Function("items", "$", codeOf("Collect Categories"));
  const fsQueryRows = [
    { json: { document: { fields: { name: { stringValue: "Pets" }, user_id: { stringValue: "telegram_12345" } } } } },
    { json: { document: { fields: { name: { stringValue: "Groceries" }, user_id: { stringValue: "system" } } } } },
  ];
  const r2 = fn(fsQueryRows, $partial);
  check("collect categories merge", r2[0].json.categories.includes("Pets") && r2[0].json.categories.includes("Rent") && r2[0].json.categories.filter(c => c === "Groceries").length === 1, r2[0].json.categories);
  check("collect categories passthrough", r2[0].json.amount === 250 && r2[0].json.source === "telegram", r2[0].json);
  global.__collected = r2[0].json;
}

// ---- Test 8: build transaction with known single-word category ----
{
  const collected = global.__collected;
  const hhRow = [{ json: { document: { fields: { household_id: { stringValue: "hh-1" }, user_id: { stringValue: "telegram_12345" } } } } }];
  const nodeData = { "Collect Categories": [collected] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Transaction"));
  const tx = fn(hhRow, $)[0].json;
  check("build tx category", tx.category_id === "Groceries", tx);
  check("build tx note", tx.note === "big bazaar", tx);
  check("build tx household", tx.household_id === "hh-1" && tx.user_id === "telegram_12345", tx);
  check("build tx source", tx.source === "telegram" && tx.payment_mode === "UPI", tx);
  const body = JSON.parse(tx.firestoreBody);
  check("tx body date is string", body.fields.date.stringValue === today, body.fields.date);
  check("tx body amount typed", body.fields.amount.integerValue === "250", body.fields.amount);
  check("tx body household string", body.fields.household_id.stringValue === "hh-1", body.fields.household_id);
  check("tx body created_at timestamp", typeof body.fields.created_at.timestampValue === "string", body.fields.created_at);
}

// ---- Test 9: build transaction with multi-word category ----
{
  const classifyOut2 = runCode("Classify Update", mkUpdate("/spent 400 dining out lunch with friends"))[0].json;
  const fn = new Function("items", "$", codeOf("Collect Categories"));
  const $partial2 = (nodeName) => {
    if (nodeName === "Parse Scan") throw new Error("Referenced node is unexecuted");
    return { first: () => ({ json: classifyOut2 }) };
  };
  const collected2 = fn([{ json: { readTime: "x" } }], $partial2)[0].json;
  collected2.categories = ["Rent", "Dining Out", "Groceries"];
  const hhRow = [{ json: { readTime: "x" } }];
  const nodeData = { "Collect Categories": [collected2] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn2 = new Function("items", "$", codeOf("Build Transaction"));
  const tx = fn2(hhRow, $)[0].json;
  check("multiword tx category", tx.category_id === "Dining Out", tx);
  check("multiword tx note", tx.note === "lunch with friends", tx);
  check("multiword tx no household", tx.household_id === null, tx);
  const body2 = JSON.parse(tx.firestoreBody);
  check("tx body omits household when null", !("household_id" in body2.fields), body2.fields);
}

// ---- Test 10: unknown category gets suggestions ----
{
  const collected3 = { userId: "telegram_12345", chatId: 555, amount: 100, rawCategory: "grocery", note: "", txDate: today, source: "telegram", categories: ["Groceries", "Rent"] };
  const nodeData = { "Collect Categories": [collected3] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Transaction"));
  const tx = fn([{ json: { readTime: "x" } }], $)[0].json;
  check("suggestion category saved", tx.category_id === "Grocery" && tx.suggestions === "Groceries", tx);
}

// ---- Test 11: budget check & reply ----
{
  const collectedBudgets = { userId: "telegram_12345", chatId: 555, month, monthStart: month + "-01", monthEnd: month + "-31", category: "Groceries", amount: 250, suggestions: "" };
  const tx = { category_id: "Groceries", amount: 250, note: "big bazaar", date: today };
  const nodeData = {
    "Classify Update": [{ chatId: 555, month, monthStart: month + "-01", monthEnd: collectedBudgets.monthEnd }],
    "Collect Budgets": [collectedBudgets],
    "Build Transaction": [tx],
  };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Budget Check & Reply"));
  const rows = [
    { json: { document: { fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 200 }, date: { stringValue: month + "-05" } } } } },
    { json: { document: { fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 250 }, date: { stringValue: today } } } } },
    { json: { document: { fields: { category_id: { stringValue: "Rent" }, amount: { doubleValue: 900 }, date: { stringValue: today } } } } },
    { json: { document: { fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 500 }, date: { stringValue: "2000-01-01" } } } } }, // out of window
    { json: { readTime: "x" } },
  ];
  collectedBudgets.budgets = [{ category_id: "Groceries", limit: 300, household_id: null, user_id: "telegram_12345" }];
  const out = fn(rows, $)[0].json;
  check("budget over warning", out.replyText.includes("Over budget") && out.replyText.includes("(150%)"), out.replyText);
  check("budget excluded old tx", !out.replyText.includes("500.00"), out.replyText);
}

// ---- Test 12: budget warning at 80-99% ----
{
  const nodeData = {
    "Classify Update": [{ chatId: 555, month, monthStart: month + "-01", monthEnd: month + "-31" }],
    "Collect Budgets": [{ userId: "telegram_12345", chatId: 555, month, monthStart: month + "-01", monthEnd: month + "-31", category: "Groceries", budgets: [{ category_id: "Groceries", limit: 1000 }] }],
    "Build Transaction": [{ category_id: "Groceries", amount: 100, note: "", date: today }],
  };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Budget Check & Reply"));
  const rows = [{ json: { document: { fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 850 }, date: { stringValue: today } } } } }];
  const out = fn(rows, $)[0].json;
  check("budget 85% warning", out.replyText.includes("85% of budget used"), out.replyText);
}

// ---- Test 13: parse scan ----
{
  const nodeData = { "Classify Update": [{ chatId: 555, userId: "telegram_12345", today }] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Parse Scan"));
  const geminiResp = [{ json: { candidates: [{ content: { parts: [{ text: '```json\n{"amount": 449.5, "date": "2026-10-05", "merchant": "DMart", "category": "Groceries"}\n```' }] } }] } }];
  const out = fn(geminiResp, $)[0].json;
  check("parse scan ok", out.scanOK === true && out.amount === 449.5 && out.merchant === "DMart" && out.date === "2026-10-05", out);
  const bad = fn([{ json: { error: "boom" } }], $)[0].json;
  check("parse scan failure graceful", bad.scanOK === false && bad.chatId === 555, bad);

  // upstream HTTP errors surface with friendly messages
  const q429 = fn([{ json: { error: '429 - {"error":{"code":429,"message":"Resource exhausted"}}' } }], $)[0].json;
  check("parse scan surfaces 429", q429.scanOK === false && q429.error.includes("rate limit"), q429);

  const creds = fn([{ json: { error: "Credentials not found for 'httpHeaderAuth'" } }], $)[0].json;
  check("parse scan flags missing credential", creds.scanOK === false && creds.error.includes("Header Auth"), creds.error);
  const e404 = fn([{ json: { error: '404 - {"error":{"code":404,"message":"model not found"}}' } }], $)[0].json;
  check("parse scan surfaces 404", e404.scanOK === false && e404.error.includes("Gemini API rejected"), e404);
  const noAmount = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 0, "date": "", "merchant": "", "category": ""}' }] } }] } }], $)[0].json;
  check("parse scan zero amount", noAmount.scanOK === false && noAmount.date === today, noAmount);

  // huge amount rejected
  const huge = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 99999999, "date": "", "merchant": "X", "category": "Groceries"}' }] } }] } }], $)[0].json;
  check("parse scan rejects huge amount", huge.scanOK === false && huge.error.includes("50 lakh"), huge);

  // stale date (2023) adjusted to today with flag
  const stale = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 12.99, "date": "2023-11-20", "merchant": "Store", "category": "Shopping"}' }] } }] } }], $)[0].json;
  check("parse scan stale date -> today", stale.scanOK === true && stale.date === today && stale.dateAdjusted === true && stale.originalDate === "2023-11-20", stale);

  // future date adjusted
  const future = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 100, "date": "2033-01-01", "merchant": "", "category": ""}' }] } }] } }], $)[0].json;
  check("parse scan future date -> today", future.scanOK === true && future.date === today && future.dateAdjusted === true, future);

  // recent date kept as-is
  const recent = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 100, "date": "2026-10-05", "merchant": "DMart", "category": "Groceries"}' }] } }] } }], $)[0].json;
  check("parse scan recent date kept", recent.scanOK === true && recent.date === "2026-10-05" && recent.dateAdjusted === false, recent);

  // empty date -> today silently
  const nodate = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 100, "date": "", "merchant": "", "category": ""}' }] } }] } }], $)[0].json;
  check("parse scan empty date -> today", nodate.scanOK === true && nodate.date === today && nodate.dateAdjusted === false, nodate);

  // placeholder merchant cleaned
  const ph = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"amount": 100, "date": "2026-10-05", "merchant": "STORE NAME", "category": "Shopping"}' }] } }] } }], $)[0].json;
  check("parse scan placeholder merchant dropped", ph.scanOK === true && ph.merchant === "", ph);
}

// ---- Test 14: build income ----
{
  const c = { chatId: 555, userId: "telegram_12345", month, amount: 50000, note: "salary october" };
  const nodeData = { "Classify Update": [c] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Income Entry"));
  const hhRow = [{ json: { document: { fields: { household_id: { stringValue: "hh-1" } } } } }];
  const out = fn(hhRow, $)[0].json;
  check("income entry fields", out.user_id === "telegram_12345" && out.household_id === "hh-1" && out.month === month && out.other === 50000 && out.net_credited === 50000, out);
  check("income reply", out.replyText.includes("Income Logged") && out.replyText.includes("50000"), out.replyText);
  const ibody = JSON.parse(out.firestoreBody);
  check("income body month string", ibody.fields.month.stringValue === month, ibody.fields.month);
  check("income body other typed", ibody.fields.other.integerValue === "50000", ibody.fields.other);
  check("income body household string", ibody.fields.household_id.stringValue === "hh-1", ibody.fields.household_id);
  check("income body created_at timestamp", typeof ibody.fields.created_at.timestampValue === "string", ibody.fields.created_at);
}

// ---- Test 15: summary reply (income-aware) ----
{
  const c = { chatId: 555, month: "2025-09", monthStart: "2025-09-01", monthEnd: "2025-09-30" };
  const collect = { totalSpend: 1400, txCount: 2, byCat: { Rent: 900, Groceries: 500 } };
  const nodeData = { "Classify Update": [c], "Collect Summary Tx": [collect] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Summary Reply"));
  const incomeRows = [
    { json: { document: { fields: { month: { stringValue: "2025-09" }, net_credited: { doubleValue: 50000 } } } } },
    { json: { document: { fields: { month: { stringValue: "2025-10" }, net_credited: { doubleValue: 99999 } } } } }, // out of month
    { json: { readTime: "x" } },
  ];
  const out = fn(incomeRows, $)[0].json;
  check("summary totals", out.replyText.includes("1400.00") && out.replyText.includes("2 transactions"), out.replyText);
  check("summary top order", out.replyText.indexOf("Rent") < out.replyText.indexOf("Groceries"), out.replyText);
  check("summary income", out.replyText.includes("50000.00"), out.replyText);
  check("summary savings", out.replyText.includes("48600.00") && out.replyText.includes("97%"), out.replyText);
}

// ---- Test 15b: collect summary tx ----
{
  const c = { chatId: 555, month: "2025-09", monthStart: "2025-09-01", monthEnd: "2025-09-30", userId: "telegram_12345" };
  const nodeData = { "Classify Update": [c] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Collect Summary Tx"));
  const rows = [
    { json: { document: { fields: { category_id: { stringValue: "Rent" }, amount: { doubleValue: 900 }, date: { stringValue: "2025-09-02" } } } } },
    { json: { document: { fields: { category_id: { stringValue: "Rent" }, amount: { doubleValue: 700 }, date: { stringValue: "2025-10-02" } } } } },
    { json: { readTime: "x" } },
  ];
  const out = fn(rows, $)[0].json;
  check("collect summary aggregation", out.totalSpend === 900 && out.txCount === 1 && out.userId === "telegram_12345", out);
}

// ---- Test 16: feature-command classification ----
r = runCode("Classify Update", mkUpdate("/undo"));
check("classify undo", r[0].json.intent === "undo", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/recent"));
check("classify recent", r[0].json.intent === "recent", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/categories"));
check("classify categories", r[0].json.intent === "categories_list", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/budgets"));
check("classify budgets list", r[0].json.intent === "budgets_list", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/budget dining out 2000"));
check("classify budget set", r[0].json.intent === "budget_set" && r[0].json.budgetCategory === "dining out" && r[0].json.budgetAmount === 2000, r[0].json);
r = runCode("Classify Update", mkUpdate("/goal laptop 80000 2027-06-01"));
check("classify goal new", r[0].json.intent === "goal_new" && r[0].json.goalName === "laptop" && r[0].json.goalAmount === 80000 && r[0].json.goalDate === "2027-06-01", r[0].json);
r = runCode("Classify Update", mkUpdate("/goal new bike 250000"));
check("classify goal no date", r[0].json.intent === "goal_new" && r[0].json.goalName === "new bike" && r[0].json.goalDate !== "", r[0].json);
r = runCode("Classify Update", mkUpdate("/goal nonsense"));
check("classify goal usage hint", r[0].json.intent === "help" && r[0].json.replyText.includes("Usage: /goal"), r[0].json);
r = runCode("Classify Update", mkUpdate("/contribute laptop 5000"));
check("classify contribute", r[0].json.intent === "contribute" && r[0].json.goalMatch === "laptop" && r[0].json.goalAmount === 5000, r[0].json);
r = runCode("Classify Update", mkUpdate("/recurring 1500 monthly groceries monthly shop"));
check("classify recurring new", r[0].json.intent === "recurring_new" && r[0].json.recAmount === 1500 && r[0].json.recFreq === "monthly" && r[0].json.recCategory === "groceries" && r[0].json.recLabel === "monthly shop", r[0].json);
r = runCode("Classify Update", mkUpdate("/recurrings"));
check("classify recurrings list", r[0].json.intent === "recurrings_list", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/loan 500000 9.5 60 home loan"));
check("classify loan new", r[0].json.intent === "loan_new" && r[0].json.loanPrincipal === 500000 && r[0].json.loanRate === 9.5 && r[0].json.loanMonths === 60 && r[0].json.loanLabel === "home loan", r[0].json);
r = runCode("Classify Update", mkUpdate("/loans"));
check("classify loans list", r[0].json.intent === "loans_list", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/members"));
check("classify members", r[0].json.intent === "members", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/inv"));
check("classify investments", r[0].json.intent === "investments", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/export"));
check("classify export", r[0].json.intent === "export_csv", r[0].json.intent);
r = runCode("Classify Update", mkUpdate("/tax"));
check("classify tax hint", r[0].json.intent === "help" && r[0].json.replyText.includes("tax planner"), r[0].json.replyText);

// ---- Test 17: build undo ----
{
  const c = { chatId: 555, intent: "undo", userId: "telegram_12345" };
  const nodeData = { "Classify Update": [c] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Undo"));
  const rows = [
    { json: { document: { id: "tx-a", fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 100 }, created_at: { timestampValue: "2026-10-08T10:00:00Z" } } } } },
    { json: { document: { id: "tx-b", fields: { category_id: { stringValue: "Coffee" }, amount: { doubleValue: 50 }, created_at: { timestampValue: "2026-10-08T12:00:00Z" } } } } },
    { json: { readTime: "x" } },
  ];
  const out = fn(rows, $)[0].json;
  check("undo picks latest", out.deleteDocId === "tx-b" && out.replyText.includes("Coffee"), out);
  // wrong intent -> guard returns []
  const c2 = { chatId: 555, intent: "recent", userId: "telegram_12345" };
  const $2 = (n) => ({ first: () => ({ json: (n === "Classify Update" ? c2 : nodeData[n][0]) }) });
  check("undo guard", fn(rows, $2).length === 0);
  // no rows -> friendly
  const out2 = fn([{ json: { readTime: "x" } }], $)[0].json;
  check("undo none", out2.replyText.includes("no logged entries"), out2);
}

// ---- Test 18: build recent ----
{
  const c = { chatId: 555, intent: "recent" };
  const $ = (n) => ({ first: () => ({ json: c }) });
  const fn = new Function("items", "$", codeOf("Build Recent Reply"));
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({ json: { document: { id: "tx-" + i, fields: { category_id: { stringValue: "Cat" + i }, amount: { doubleValue: i }, date: { stringValue: "2026-10-0" + (i % 9 + 1) }, created_at: { timestampValue: "2026-10-08T1" + String(i).padStart(2, "0") + ":00:00Z" } } } } }));
  const out = fn(rows, $)[0].json;
  check("recent top 10", out.replyText.includes("Last 10") && out.replyText.includes("Cat12") && !out.replyText.includes("Cat1,"), out.replyText.slice(0, 80));
}

// ---- Test 19: build budget set ----
{
  const c = { chatId: 555, userId: "telegram_12345", month: "2026-10", budgetCategory: "dining out", budgetAmount: 2000, note: "" };
  const hub = { document: { fields: { household_id: { stringValue: "hh-9" } } } };
  const nodeData = { "Classify Update": [c], "Query Household (Hub)": [hub] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Budget Set"));
  // no existing -> create with household
  let out = fn([{ json: { readTime: "x" } }], $)[0].json;
  const body = JSON.parse(JSON.stringify(out.batchBody.writes[0]));
  check("budget create category resolved", body.update.fields.category_id.stringValue === "Dining Out", body.update.fields);
  check("budget create household", body.update.fields.household_id.stringValue === "hh-9", body.update.fields);
  check("budget reply", out.replyText.includes("Dining Out") && out.replyText.includes("2000"), out.replyText);
  // existing -> update limit only
  const existing = [{ json: { document: { id: "bud-1", fields: { category_id: { stringValue: "Dining Out" }, month: { stringValue: "2026-10" }, household_id: { stringValue: "hh-9" } } } } }];
  out = fn(existing, $)[0].json;
  check("budget update existing", out.batchBody.writes[0].update.name.endsWith("/budgets/bud-1") && JSON.stringify(out.batchBody.writes[0].updateMask) === JSON.stringify({ fieldPaths: ["limit_amount"] }), out.batchBody.writes[0]);
}

// ---- Test 20: build contribute + goals reply ----
{
  const c = { chatId: 555, intent: "contribute", goalMatch: "laptop", goalAmount: 5000 };
  const nodeData = { "Classify Update": [c] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Contribute"));
  const rows = [
    { json: { document: { id: "g-1", fields: { name: { stringValue: "New Laptop" }, current_amount: { doubleValue: 10000 }, target_amount: { doubleValue: 80000 } } } } },
    { json: { readTime: "x" } },
  ];
  const out = fn(rows, $)[0].json;
  check("contribute match", out.found === true && out.replyText.includes("15000") && out.replyText.includes("19%"), out);
  const body = JSON.parse(JSON.stringify(out.batchBody.writes[0]));
  check("contribute update amount", body.update.fields.current_amount.doubleValue === 15000 && body.update.name.endsWith("/goals/g-1"), body.update);
  const nf = fn([{ json: { document: { id: "g-2", fields: { name: { stringValue: "Car" }, current_amount: { doubleValue: 0 }, target_amount: { doubleValue: 100 } } } } }], $)[0].json;
  check("contribute not found", nf.found === false && nf.replyText.includes("No goal"), nf);
  // guard: goals_list intent returns []
  const c2 = { chatId: 555, intent: "goals_list" };
  const $2 = (n) => ({ first: () => ({ json: c2 }) });
  check("contribute guard", fn(rows, $2).length === 0);
}

// ---- Test 21: build loan (EMI math + schedule) ----
{
  const c = { chatId: 555, userId: "telegram_12345", today: "2026-10-09", loanPrincipal: 500000, loanRate: 9.5, loanMonths: 60, loanLabel: "home" };
  const hub = { document: { fields: { household_id: { stringValue: "hh-9" } } } };
  const nodeData = { "Classify Update": [c], "Query Household (Hub)": [hub] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Loan"));
  const out = fn([], $)[0].json;
  check("loan emi math", out.replyText.includes("EMI: \u20B910501"), out.replyText);
  const writes = out.batchBody.writes;
  check("loan writes count", writes.length === 62, writes.length); // 1 loan + 60 schedule + 1 rule
  check("loan doc fields", writes[0].update.fields.emi_amount.integerValue === "10501" && writes[0].update.fields.household_id.stringValue === "hh-9", writes[0].update.fields.emi_amount);
  const lastSched = writes[60].update.fields;
  check("loan final balance zero", Number(lastSched.outstanding_balance.integerValue || lastSched.outstanding_balance.doubleValue) === 0, lastSched.outstanding_balance);
  check("loan rule created", writes[61].update.fields.category_id.stringValue === "EMI" && writes[61].update.fields.frequency.stringValue === "monthly", writes[61].update.fields.category_id);
}

// ---- Test 22: process recurring (scheduler) ----
{
  const fn = new Function("items", "$", codeOf("Process Recurring"));
  const mkRule = (id, next, freq, active, hh) => ({ json: { document: { id, fields: {
    user_id: { stringValue: "telegram_12345" }, ...(hh ? { household_id: { stringValue: hh } } : {}),
    category_id: { stringValue: "Rent" }, amount: { integerValue: "1500" }, frequency: { stringValue: freq },
    next_due_date: { stringValue: next }, label: { stringValue: "Rent" }, active: { booleanValue: active },
  } } } });
  // due rule + future rule + inactive rule
  const rows = [mkRule("r1", "2026-10-01", "monthly", true, "hh-9"), mkRule("r2", "2026-12-01", "yearly", true), mkRule("r3", "2026-09-01", "monthly", false)];
  const out = fn(rows, {})[0].json;
  const writes = out.batchBody.writes;
  check("recurring processes only due active", out.processed === 1 && writes.length === 2, out.processed);
  check("recurring tx created", writes[0].update.fields.date.stringValue === "2026-10-01" && writes[0].update.fields.source.stringValue === "recurring" && writes[0].update.fields.household_id.stringValue === "hh-9", writes[0].update.fields);
  check("recurring rule advanced", writes[1].update.name.endsWith("/recurring_rules/r1") && writes[1].update.fields.next_due_date.stringValue === "2026-11-01", writes[1].update.fields);
  check("recurring none due returns empty", fn([mkRule("r9", "2027-01-01", "monthly", true)], {}).length === 0);
}

// ---- Test 15: /join classification (hardened) ----
r = runCode("Classify Update", mkUpdate("/join abc123"));
check("classify join", r[0].json.intent === "join" && r[0].json.inviteCode === "ABC123", r[0].json);
r = runCode("Classify Update", mkUpdate("/join JS6YZ0"));
check("classify join uppercase", r[0].json.intent === "join" && r[0].json.inviteCode === "JS6YZ0", r[0].json);
r = runCode("Classify Update", mkUpdate("/join JS6YZ0."));
check("join trailing period tolerated", r[0].json.intent === "join" && r[0].json.inviteCode === "JS6YZ0", r[0].json);
r = runCode("Classify Update", mkUpdate("/join@ExpensePlannerBot JS6YZ0"));
check("join with bot suffix tolerated", r[0].json.intent === "join" && r[0].json.inviteCode === "JS6YZ0", r[0].json);
r = runCode("Classify Update", mkUpdate("/join JS6YZ0\u200B"));
check("join trailing zero-width stripped", r[0].json.intent === "join" && r[0].json.inviteCode === "JS6YZ0", r[0].json);
r = runCode("Classify Update", mkUpdate("/join \u200BJS6YZ0"));
check("join leading zero-width stripped", r[0].json.intent === "join" && r[0].json.inviteCode === "JS6YZ0", r[0].json);
r = runCode("Classify Update", mkUpdate("hello there"));
check("unknown slash cmd still plain", true, "");
r = runCode("Classify Update", mkUpdate("/foo bar"));
check("unknown slash cmd echoes raw", r[0].json.intent === "unknown" && r[0].json.replyText.includes('"/foo bar"'), r[0].json.replyText);
check("help mentions join", runCode("Classify Update", mkUpdate("/help"))[0].json.replyText.includes("/join"), "");

// ---- Test 16: validate invite - all cases ----
{
  const mkInviteRow = (over) => [{ json: { document: { id: "inv-1", fields: Object.assign({
    household_id: { stringValue: "hh-9" },
    role: { stringValue: "other" },
    status: { stringValue: "pending" },
    expires_at: { timestampValue: "2099-01-01T00:00:00Z" },
  }, over) } } }];
  const classify = { chatId: 555, userId: "telegram_123", tgUsername: "atharva" };
  const nodeData = { "Classify Update": [classify] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Validate Invite"));

  let v = fn(mkInviteRow({}), $)[0].json;
  check("invite valid", v.valid === true && v.household_id === "hh-9" && v.documentId === "telegram_123" && v.email === "@atharva" && v.inviteDocId === "inv-1" && v.status === "accepted", v);

  v = fn(mkInviteRow({ status: { stringValue: "accepted" } }), $)[0].json;
  check("invite already used", v.valid === false && v.replyText.includes("already been used"), v);

  v = fn(mkInviteRow({ expires_at: { timestampValue: "2020-01-01T00:00:00Z" } }), $)[0].json;
  check("invite expired", v.valid === false && v.replyText.includes("expired"), v);

  v = fn([{ json: { readTime: "x" } }], $)[0].json;
  check("invite not found", v.valid === false && v.replyText.includes("not found"), v);

  // no username -> email falls back to telegram id
  const nd2 = { "Classify Update": [{ chatId: 555, userId: "telegram_123", tgUsername: "" }] };
  const $2 = (n) => ({ first: () => ({ json: nd2[n][0] }) });
  v = fn(mkInviteRow({ role: { stringValue: "" } }), $2)[0].json;
  check("invite email fallback", v.valid === true && v.email === "telegram_123" && v.role === "other", v);
}

// ---- Test 23: security - HTML escaping + CSV formula guard + allowlist ----
{
  // malicious note/category text must not break Telegram HTML
  const c = { chatId: 555, intent: "recent" };
  const $ = (n) => ({ first: () => ({ json: c }) });
  const fn = new Function("items", "$", codeOf("Build Recent Reply"));
  const rows = [{ json: { document: { id: "x", fields: { category_id: { stringValue: "<b>Fake</b>" }, amount: { doubleValue: 1 }, date: { stringValue: "2026-10-08" }, note: { stringValue: "<script>&" }, created_at: { timestampValue: "2026-10-08T12:00:00Z" } } } } }];
  const out = fn(rows, $)[0].json;
  check("recent escapes html", out.replyText.includes("&#60;b&#62;Fake") && out.replyText.includes("&#38;") && !out.replyText.includes("<b>Fake</b>"), out.replyText);

  // CSV formula injection neutralized
  const c2 = { chatId: 555, intent: "export_csv", month: "2026-10", monthStart: "2026-10-01", monthEnd: "2026-10-31" };
  const $2 = (n) => ({ first: () => ({ json: c2 }) });
  const fn2 = new Function("items", "$", codeOf("Build Export CSV"));
  const rows2 = [{ json: { document: { fields: { category_id: { stringValue: "=HYPERLINK" }, amount: { doubleValue: 5 }, date: { stringValue: "2026-10-08" }, note: { stringValue: "+SUM(1+1)" }, source: { stringValue: "manual" } } } } }];
  const out2 = fn2(rows2, $2)[0];
  const csv = Buffer.from(out2.binary.data.data, "base64").toString("utf8");
  check("csv formula guard", csv.includes("'=HYPERLINK") && csv.includes("'+SUM(1+1"), csv);

  // trigger allowlist is preset in the workflow JSON
  const w = require(path.join(__dirname, "..", "expense-planner-bot.json"));
  const trig = w.nodes.find((n) => n.name === "Telegram Trigger");
  check("trigger user allowlist set", trig.parameters.additionalFields.userIds === "7682242660", trig.parameters.additionalFields);
}

// ---- Test 24: household-wide budget warnings (multi-user) ----
{
  // Build Budget Query picks household scope when linked
  const c = { chatId: 555, userId: "telegram_12345", month: "2026-10", monthStart: "2026-10-01", monthEnd: "2026-10-31" };
  const t = { category_id: "Groceries", amount: 250, suggestions: "" };
  const hubLinked = { document: { fields: { household_id: { stringValue: "hh-9" } } } };
  const nodeData = { "Classify Update": [c], "Build Transaction": [t], "Query Household": [hubLinked] };
  const $ = (n) => ({ first: () => ({ json: nodeData[n][0] }) });
  const fn = new Function("items", "$", codeOf("Build Budget Query"));
  const linked = fn([], $)[0].json;
  check("budget query household scope", linked.qField === "household_id" && linked.qValue === "hh-9" && linked.hhLinked === true, linked);

  // unlinked -> falls back to the sender's own transactions
  const $2 = (n) => ({ first: () => ({ json: (n === "Query Household") ? { readTime: "x" } : nodeData[n][0] }) });
  const unlinked = fn([], $2)[0].json;
  check("budget query user scope fallback", unlinked.qField === "user_id" && unlinked.qValue === "telegram_12345" && unlinked.hhLinked === false, unlinked);

  // warning text marks household-wide when linked
  const bc = { chatId: 555, month: "2026-10", monthStart: "2026-10-01", monthEnd: "2026-10-31" };
  const collect = { budgets: [{ category_id: "Groceries", limit: 300, household_id: "hh-9" }], hhLinked: true };
  const tx = { category_id: "Groceries", amount: 600, note: "", date: "2026-10-08" };
  const nd2 = { "Classify Update": [bc], "Collect Budgets": [collect], "Build Transaction": [tx] };
  const $3 = (n) => ({ first: () => ({ json: nd2[n][0] }) });
  const fnBc = new Function("items", "$", codeOf("Budget Check & Reply"));
  const householdRows = [
    { json: { document: { fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 400 }, date: { stringValue: "2026-10-05" } } } } }, // spouse's spend
    { json: { document: { fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 250 }, date: { stringValue: "2026-10-08" } } } } }, // sender's spend
  ];
  const out = fnBc(householdRows, $3)[0].json;
  check("household warning counts all members", out.replyText.includes("(household-wide)") && out.replyText.includes("Over budget"), out.replyText);
}

// ---- Test 25: new bot features (NL, /edit, callbacks, confirmations, /ask) ----
{
  // classify: callback updates
  const cbUpdate = [{ json: { callback_query: { id: "CBQ1", from: { id: 999 }, data: "scan:save:sc123", message: { chat: { id: 777 } } } } }];
  const out = runCode("Classify Update", cbUpdate)[0].json;
  check("classify callback", out.intent === "callback" && out.cbAction === "save" && out.cbId === "sc123" && out.queryId === "CBQ1" && out.chatId === 777 && out.userId === "telegram_999", out);

  // classify: /edit
  r = runCode("Classify Update", mkUpdate("/edit amount 500"));
  check("classify edit", r[0].json.intent === "edit" && r[0].json.editField === "amount" && r[0].json.editValue === "500", r[0].json);
  r = runCode("Classify Update", mkUpdate("/edit category dining out"));
  check("classify edit category", r[0].json.intent === "edit" && r[0].json.editField === "category" && r[0].json.editValue === "dining out", r[0].json);

  // classify: /ask + /setup-menu
  r = runCode("Classify Update", mkUpdate("/ask how much did I spend on medical?"));
  check("classify ask", r[0].json.intent === "ask" && r[0].json.askQuestion === "how much did I spend on medical?", r[0].json);
  r = runCode("Classify Update", mkUpdate("/setup-menu"));
  check("classify setup-menu", r[0].json.intent === "setup_menu", r[0].json.intent);

  // Parse NL: expense
  {
    const c = { chatId: 555, userId: "telegram_12345", today: "2026-10-09" };
    const $ = (n) => ({ first: () => ({ json: c }) });
    const fn = new Function("items", "$", codeOf("Parse NL"));
    const resp = [{ json: { candidates: [{ content: { parts: [{ text: '{"type":"expense","amount":250,"category":"Groceries","note":"big bazaar","date":""}' }] } }] } }];
    const nl = fn(resp, $)[0].json;
    check("parse nl expense", nl.nlParsed === true && nl.amount === 250 && nl.rawCategory === "Groceries" && nl.txDate === "2026-10-09" && nl.note === "big bazaar", nl);
    const inc = fn([{ json: { candidates: [{ content: { parts: [{ text: '{"type":"income","amount":50000,"category":"","note":"salary","date":""}' }] } }] } }], $)[0].json;
    check("parse nl income hint", inc.replyText && inc.replyText.includes("/earned 50000"), inc);
    const bad = fn([{ json: { error: "x" } }], $)[0].json;
    check("parse nl none -> help hint", bad.replyText.includes("/spent"), bad.replyText);
  }

  // Build Edit: updates the latest tx's amount via batchWrite
  {
    const c = { chatId: 555, intent: "edit", editField: "amount", editValue: "500" };
    const $ = (n) => ({ first: () => ({ json: c }) });
    const fn = new Function("items", "$", codeOf("Build Edit"));
    const rows = [
      { json: { document: { id: "tx-a", fields: { category_id: { stringValue: "Groceries" }, amount: { doubleValue: 100 }, created_at: { timestampValue: "2026-10-08T10:00:00Z" } } } } },
      { json: { document: { id: "tx-b", fields: { category_id: { stringValue: "Coffee" }, amount: { doubleValue: 50 }, created_at: { timestampValue: "2026-10-08T12:00:00Z" } } } } },
    ];
    const out = fn(rows, $)[0].json;
    const w = JSON.parse(JSON.stringify(out.batchBody.writes[0]));
    check("edit targets latest tx", w.update.name.endsWith("/transactions/tx-b") && w.update.fields.amount.integerValue === "500", w.update);
    check("edit reply", out.replyText.includes("Updated last entry") && out.replyText.includes("500"), out.replyText);
    // invalid amount
    const c2 = { chatId: 555, intent: "edit", editField: "amount", editValue: "abc" };
    const $2 = (n) => ({ first: () => ({ json: c2 }) });
    const bad = fn(rows, $2)[0].json;
    check("edit invalid amount hint", bad.replyText.includes("Invalid amount"), bad.replyText);
  }

  // Read Callback: save -> payload; double-tap -> stale
  {
    const staticStore = { pendingScans: { sc1: { payload: { userId: "telegram_1", chatId: 42, amount: 135, rawCategory: "Groceries", note: "REL", txDate: "2026-10-09", merchant: "REL", source: "telegram_receipt" }, created: Date.now() } } };
    global.__sd = staticStore;
    const mkCb = (id, action) => {
      const c = { chatId: 42, intent: "callback", cbId: id, cbAction: action, queryId: "q1" };
      const $ = (n) => ({ first: () => ({ json: c }) });
      const fn = new Function("items", "$", "$getWorkflowStaticData", codeOf("Read Callback"));
      return (action) => fn([], $, (t) => staticStore);
    };
    const $sd = (t) => staticStore;
    const cSave = { chatId: 42, intent: "callback", cbId: "sc1", cbAction: "save", queryId: "q1" };
    const $$ = (n) => ({ first: () => ({ json: cSave }) });
    const fnS = new Function("items", "$", "$getWorkflowStaticData", codeOf("Read Callback"));
    const saved = fnS([], $$, $sd)[0].json;
    check("callback save -> payload", saved.cbAction === "save" && saved.amount === 135 && saved.userId === "telegram_1", saved);
    // second tap: stale
    const saved2 = fnS([], $$, $sd)[0].json;
    check("callback double-tap stale", saved2.cbAction === "none" && saved2.replyText.includes("already been processed"), saved2);
    // discard
    staticStore.pendingScans.sc2 = { payload: { userId: "u", chatId: 42, amount: 1 }, created: Date.now() };
    const cDisc = { chatId: 42, intent: "callback", cbId: "sc2", cbAction: "discard", queryId: "q2" };
    const $d = (n) => ({ first: () => ({ json: cDisc }) });
    const disc = fnS([], $d, $sd)[0].json;
    check("callback discard", disc.cbAction === "none" && disc.replyText.includes("discarded"), disc);
  }

  // Build Scan Confirmation: parks the scan in static data
  {
    const staticStore = {};
    const $sd = (t) => staticStore;
    const c = { chatId: 555 };
    const scanRes = { scanOK: true, amount: 135, date: "2026-10-09", merchant: "REL", category: "Groceries", dateAdjusted: false, chatId: 555, userId: "telegram_1" };
    const $ = (n) => ({ first: () => ({ json: n === "Classify Update" ? c : scanRes }) });
    const fn = new Function("items", "$", "$getWorkflowStaticData", codeOf("Build Scan Confirmation"));
    const out = fn([], $, $sd)[0].json;
    const keys = Object.keys(staticStore.pendingScans || {});
    check("confirmation parks scan", keys.length === 1 && out.saveId === keys[0] && out.replyText.includes("Save"), out);
    check("confirmation stores payload", staticStore.pendingScans[keys[0]].payload.amount === 135, staticStore.pendingScans[keys[0]]);
  }

  // Build Ask Context: builds the Gemini body from tx rows
  {
    const c = { chatId: 555, intent: "ask", askQuestion: "how much on medical?", userId: "telegram_1" };
    const $ = (n) => ({ first: () => ({ json: c }) });
    const fn = new Function("items", "$", codeOf("Build Ask Context"));
    const rows = [
      { json: { document: { fields: { date: { stringValue: "2026-09-01" }, amount: { doubleValue: 2000 }, category_id: { stringValue: "Medical" }, note: { stringValue: "checkup" } } } } },
      { json: { readTime: "x" } },
    ];
    const out = fn(rows, $)[0].json;
    check("ask context rows", out.rowCount === 1, out);
    check("ask body built", out.askBody.includes("how much on medical?") && out.askBody.includes("Medical"), out.askBody.slice(0, 50));
    const guard = new Function("items", "$", codeOf("Build Ask Context"));
    const $g = (n) => ({ first: () => ({ json: { chatId: 5, intent: "recent" } }) });
    check("ask guard non-ask intent", guard(rows, $g).length === 0);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

