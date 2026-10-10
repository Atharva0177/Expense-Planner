const path = require('path');
// Semantic check: each "Route by Intent" switch output must be wired to the
// node that matches its intent (catches off-by-one wiring bugs).
const w = require(path.join(__dirname, "..", "expense-planner-bot.json"));
const sw = w.nodes.find((n) => n.name === "Route by Intent");

const expected = {
  "Expense Text": "Query Categories",
  "Receipt Photo": "Get Telegram Photo",
  Income: "Query Household (Income)",
  Summary: "Query Month Transactions (Summary)",
  Help: "Send Help",
  Join: "Query Invites",
  Unknown: "Send Help",
  undo: "Query My Transactions",
  recent: "Query My Transactions",
  categories_list: "Query Categories (List)",
  budget_set: "Query Household (Hub)",
  budgets_list: "Query Household (Hub)",
  goal_new: "Query Household (Hub)",
  contribute: "Query Household (Hub)",
  goals_list: "Query Household (Hub)",
  recurring_new: "Query Household (Hub)",
  recurrings_list: "Query Household (Hub)",
  loan_new: "Query Household (Hub)",
  loans_list: "Query Household (Hub)",
  members: "Query Household (Hub)",
  investments: "Query Household (Hub)",
  export_csv: "Query My Transactions",
  edit: "Query My Transactions",
  ask: "Query My Transactions",
  setup_menu: "Register Bot Menu",
  nl_parse: "Build NL Prompt",
  callback: "Answer Callback",
};

const expectedDispatch = {
  budget_set: "Query Month Budgets (Set)",
  budgets_list: "Query Budgets (List)",
  goal_new: "Build Goal",
  contribute: "Prep Goals Query",
  goals_list: "Prep Goals Query",
  recurring_new: "Build Recurring",
  recurrings_list: "Prep Recurrings Query",
  loan_new: "Build Loan",
  loans_list: "Prep Loans Query",
  members: "Prep Members Query",
  investments: "Prep Investments Query",
};

let bad = 0;
const rules = sw.parameters.rules.values;
const conns = w.connections["Route by Intent"].main;

if (rules.length !== conns.length) {
  console.log(`BAD: ${rules.length} rules but ${conns.length} connections`);
  bad++;
}

rules.forEach((rule, idx) => {
  const key = rule.outputKey;
  const target = conns[idx] && conns[idx][0] && conns[idx][0].node;
  const want = expected[key];
  if (target === want) {
    console.log(`OK  output ${idx} "${key}" -> ${target}`);
  } else {
    console.log(`BAD output ${idx} "${key}" -> ${target} (expected ${want})`);
    bad++;
  }
});

// Also verify every intent classify can emit has a rule
const classify = w.nodes.find((n) => n.name === "Classify Update").parameters.jsCode;
const intents = ["expense_text", "photo", "income_text", "summary", "join", "help", "unknown",
  "undo", "recent", "categories_list", "budget_set", "budgets_list", "goal_new", "contribute",
  "goals_list", "recurring_new", "recurrings_list", "loan_new", "loans_list", "members",
  "investments", "export_csv", "edit", "ask", "setup_menu", "nl_parse", "callback"];
const ruleIntents = rules.map((r) => r.conditions.conditions[0].rightValue);
for (const it of intents) {
  if (!ruleIntents.includes(it)) { console.log(`BAD: no switch rule for intent "${it}"`); bad++; }
  if (!classify.includes(`'${it}'`)) { console.log(`BAD: classify never emits intent "${it}"`); bad++; }
}

// Dispatch switch (after household hub)
const dsw = w.nodes.find((n) => n.name === "Dispatch After Household");
const drules = dsw.parameters.rules.values;
const dconns = w.connections["Dispatch After Household"].main;
drules.forEach((rule, idx) => {
  const key = rule.outputKey;
  const target = dconns[idx] && dconns[idx][0] && dconns[idx][0].node;
  const want = expectedDispatch[key];
  if (target === want) console.log(`OK  dispatch "${key}" -> ${target}`);
  else { console.log(`BAD dispatch "${key}" -> ${target} (expected ${want})`); bad++; }
});

console.log(bad === 0 ? "\nSWITCH WIRING CORRECT" : `\n${bad} WIRING PROBLEMS`);
process.exit(bad ? 1 : 0);
