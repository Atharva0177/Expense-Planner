// Generator for n8n/expense-planner-bot.json â€” run: node gen-workflow.cjs
const fs = require("fs");

const PROJECT_ID = "gen-lang-client-0213350901";
const DATABASE_ID = "ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5";

let uidCounter = 0;
const uid = () => "node-" + (++uidCounter).toString().padStart(2, "0") + "-" + Math.random().toString(36).slice(2, 8);

// ---------- shared node factories ----------

function fsQueryNode(name, position, queryJson, queryParametersExpr) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.googleFirebaseCloudFirestore",
    typeVersion: 1.1,
    position,
    parameters: {
      authentication: "serviceAccount",
      resource: "document",
      operation: "query",
      projectId: PROJECT_ID,
      database: DATABASE_ID,
      // Static JSON with $1/$2 placeholders; values come from Query Parameters.
      // This avoids n8n's expression parser, which cannot handle nested object literals.
      query: queryJson,
      queryParameters: queryParametersExpr,
      simple: false,
    },
  };
}

function fsUpsertNode(name, position, collection, updateKey, columns, extraProps) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.googleFirebaseCloudFirestore",
    typeVersion: 1.1,
    position,
    ...(extraProps || {}),
    parameters: {
      authentication: "serviceAccount",
      resource: "document",
      operation: "upsert",
      projectId: PROJECT_ID,
      database: DATABASE_ID,
      collection,
      updateKey,
      columns,
    },
  };
}

// Raw Firestore REST writer - used instead of the Firestore node for document
// creation because the node auto-converts date-like strings (e.g. "2026-10-08")
// to timestamps, while the web app stores/queries date as a plain string.
// Authentication: Google Service Account API credential (must have Scope(s)
// set to https://www.googleapis.com/auth/datastore for use with HTTP Request).
function fsHttpCreateNode(name, position, collection) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    parameters: {
      method: "POST",
      url: `=https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collection}?documentId={{ $json.docId }}`,
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleApi",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $json.firestoreBody }}",
      options: {},
    },
  };
}

function telegramSendDocumentNode(name, position, chatIdExpr, fromNodeExpr) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.telegram",
    typeVersion: 1.2,
    position,
    parameters: {
      resource: "message",
      operation: "sendDocument",
      chatId: chatIdExpr,
      binaryData: true,
      additionalFields: {
        ...(fromNodeExpr ? {} : {}),
      },
    },
  };
}

// Generic Firestore REST document creator - collection comes from the item,
// so one node serves goals, recurring rules, and future create commands.
function fsGenericCreateNode(name, position) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position,
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    parameters: {
      method: "POST",
      url: `=https://firestore.googleapis.com/v1/${FS_DOC_BASE}/{{ $json.collection }}?documentId={{ $json.docId }}`,
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleApi",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $json.firestoreBody }}",
      options: {},
    },
  };
}

// Generic Firestore batchWrite - one node serves budget upserts, goal
// contributions, loan schedule creation, and the daily recurring processor.
function fsBatchWriteNode(name, position) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position,
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    parameters: {
      method: "POST",
      url: `https://firestore.googleapis.com/v1/${FS_DOC_BASE}:batchWrite`,
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleApi",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $json.batchBody }}",
      options: {},
    },
  };
}

function fsDeleteNode(name, position) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position,
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    parameters: {
      method: "DELETE",
      url: `=https://firestore.googleapis.com/v1/${FS_DOC_BASE}/transactions/{{ $json.deleteDocId }}`,
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleApi",
      options: {},
    },
  };
}

function ifTrueNode(name, position, condId, leftValue) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position,
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
        conditions: [
          {
            id: condId,
            leftValue,
            rightValue: true,
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  };
}

function fsCreateNode(name, position, collection, columns) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.googleFirebaseCloudFirestore",
    typeVersion: 1.1,
    position,
    parameters: {
      authentication: "serviceAccount",
      resource: "document",
      operation: "create",
      projectId: PROJECT_ID,
      database: DATABASE_ID,
      collection,
      documentId: "={{ $json.docId }}",
      columns,
    },
  };
}

function telegramSendNode(name, position, chatIdExpr, textExpr) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.telegram",
    typeVersion: 1.2,
    position,
    parameters: {
      resource: "message",
      operation: "sendMessage",
      chatId: chatIdExpr,
      text: textExpr,
      additionalFields: {
        appendAttribution: false,
        parse_mode: "HTML",
      },
    },
  };
}

function codeNode(name, position, jsCode) {
  return {
    id: uid(),
    name,
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position,
    parameters: {
      mode: "runOnceForAllItems",
      jsCode,
    },
  };
}

function condEquals(leftValue, rightValue, id) {
  return {
    id,
    leftValue,
    rightValue,
    operator: { type: "string", operation: "equals" },
  };
}

// ---------- Firestore queries (static JSON + $n placeholders; params via simple
// array expressions that the n8n expression parser can handle) ----------

const queryHouseholdJson =
  '{"structuredQuery":{"from":[{"collectionId":"household_members"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"user_id"},"op":"EQUAL","value":{"stringValue":"$1"}}}]}}}}';

const queryCategoriesJson =
  '{"structuredQuery":{"from":[{"collectionId":"categories"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"user_id"},"op":"IN","value":{"arrayValue":{"values":[{"stringValue":"$1"},{"stringValue":"$2"}]}}}}]}}}}';

const queryBudgetsJson =
  '{"structuredQuery":{"from":[{"collectionId":"budgets"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"month"},"op":"EQUAL","value":{"stringValue":"$1"}}}]}}}}';

const queryUserTransactionsJson =
  '{"structuredQuery":{"from":[{"collectionId":"transactions"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"user_id"},"op":"EQUAL","value":{"stringValue":"$1"}}}]}}}}';

const queryUserIncomesJson =
  '{"structuredQuery":{"from":[{"collectionId":"income_entries"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"user_id"},"op":"EQUAL","value":{"stringValue":"$1"}}}]}}}}';

const queryInvitesJson =
  '{"structuredQuery":{"from":[{"collectionId":"invites"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"invite_code"},"op":"EQUAL","value":{"stringValue":"$1"}}}]}}}}';

// Scoped query: field itself is a parameter ($2 = 'household_id' | 'user_id'),
// so a single static JSON serves both household-linked and unlinked users.
function scopedQueryJson(collection) {
  return `{"structuredQuery":{"from":[{"collectionId":"${collection}"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"$2"},"op":"EQUAL","value":{"stringValue":"$1"}}}]}}}}`;
}

const paramsScoped = "={{ [$json.qValue || '', $json.qField || 'user_id'] }}";

const queryActiveRecurringJson =
  '{"structuredQuery":{"from":[{"collectionId":"recurring_rules"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"active"},"op":"EQUAL","value":{"booleanValue":true}}}]}}}}';

const FS_DOC_BASE = "projects/gen-lang-client-0213350901/databases/ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5/documents";

const paramsUserId = "={{ [$json.userId || ''] }}";
const paramsUserIdAndSystem = "={{ [$json.userId || '', 'system'] }}";
const paramsMonth = "={{ [$json.month || ''] }}";
const paramsInviteCode = "={{ [$json.inviteCode || ''] }}";
const paramsClassifyMonth = "={{ [$('Classify Update').first().json.month || ''] }}";

// ---------- Code-node scripts ----------

const classifyCode = [
  "// Normalize the incoming Telegram update into a single routing payload.",
  "const update = items[0].json;",
  "// Inline-keyboard button presses arrive as callback_query updates",
  "const cbq = update.callback_query;",
  "if (cbq) {",
  "  const chatId = cbq.message && cbq.message.chat ? cbq.message.chat.id : null;",
  "  const cUserId = 'telegram_' + (cbq.from ? cbq.from.id : '');",
  "  if (chatId === null) return [];",
  "  const data = String(cbq.data || '');",
  "  const parts = data.split(':'); // e.g. scan:save:<id>",
  "  return [{ json: {",
  "    chatId,",
  "    userId: cUserId,",
  "    intent: 'callback',",
  "    cbAction: parts[1] || '',",
  "    cbId: parts[2] || '',",
  "    queryId: String(cbq.id || ''),",
  "    photoFileId: '',",
  "    today: new Date().toISOString().split('T')[0],",
  "  } }];",
  "}",
  "const msg = update.message || update.edited_message;",
  "if (!msg || !msg.from || !msg.chat) return [];",
  "",
  "const chatId = msg.chat.id;",
  "const tgUserId = msg.from.id;",
  "const userId = 'telegram_' + tgUserId;",
  "// Strip invisible Unicode chars (zero-width spaces, directional marks) that",
  "// copy-paste can inject alongside invite codes - they silently break regex anchors.",
  "const text = (msg.text || msg.caption || '').replace(/[\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]/g, '').trim();",
  "// Photo/document detection from the raw update (the trigger's own download",
  "// is DISABLED: its imageSize picker silently falls back to the ~90px thumbnail",
  "// when Telegram sends fewer sizes, which makes receipts illegible).",
  "const photoSizes = Array.isArray(msg.photo) ? msg.photo : [];",
  "const imgDoc = (msg.document && String(msg.document.mime_type || '').startsWith('image/')) ? msg.document : null;",
  "let photoFileId = '';",
  "if (photoSizes.length > 0) {",
  "  const largest = photoSizes.reduce((a, b) => ((b.width || 0) * (b.height || 0) > (a.width || 0) * (a.height || 0) ? b : a));",
  "  photoFileId = String(largest.file_id || '');",
  "} else if (imgDoc) {",
  "  photoFileId = String(imgDoc.file_id || '');",
  "}",
  "// Album detection: Telegram sends each album photo as its own message with a shared media_group_id",
  "const mediaGroupId = String(msg.media_group_id || '');",
  "",
  "const today = new Date().toISOString().split('T')[0];",
  "const month = today.slice(0, 7);",
  "const monthStart = month + '-01';",
  "const parts = month.split('-').map(Number);",
  "const monthEnd = month + '-' + String(new Date(Date.UTC(parts[0], parts[1], 0)).getUTCDate()).padStart(2, '0');",
  "",
  "const HELP_TEXT = '\\u{1F916} <b>Expense Planner Bot</b>\\n\\n<b>Log</b>\\n/spent 250 groceries [note] \\u2014 log an expense\\n\\u{1F4F8} send a receipt photo \\u2014 AI auto-logs it\\n/earned 50000 [note] \\u2014 log income\\n/undo \\u2014 delete my last entry\\n\\n<b>View</b>\\n/summary [YYYY-MM] \\u2014 spend + income breakdown\\n/recent \\u2014 my last 10 entries\\n/budgets \\u2014 budget vs spend this month\\n/goals \\u2014 savings goals with progress\\n/loans \\u2014 loans and EMI info\\n/recurrings \\u2014 recurring rules\\n/investments \\u2014 investment accounts\\n/members \\u2014 household members\\n/categories \\u2014 valid category names\\n/export \\u2014 CSV of this month\\n\\n<b>Manage</b>\\n/budget dining out 2000 \\u2014 set monthly budget\\n/goal laptop 80000 2027-06-01 \\u2014 new savings goal\\n/contribute laptop 5000 \\u2014 add to a goal\\n/recurring 1500 monthly groceries \\u2014 new recurring rule\\n/loan 500000 9.5 60 home \\u2014 new loan with schedule\\n/join [invite code] \\u2014 link to your household (code from the website Family tab)\\n/tax \\u2014 tax planner info\\n/help \\u2014 this message';",
  "const FALLBACK_TEXT = '\\u{1F914} Unrecognized command. Send /help to see everything I can do.';",
  "const TAX_HINT = '\\u{1F4DA} The tax planner (old vs new regime, HRA, 80C/80D, advance tax) needs many inputs and works best on the website: open the Taxes tab there. Bot commands cover everything else \\u2014 /help for the list.';",
  "",
  "const EXPENSE = /^\\/(?:spent|spend|paid|bought|purchase)\\s+(\\d+(?:\\.\\d+)?)\\s+(.+)$/i;",
  "const INCOME = /^\\/(?:received|got|earned|income|salary)\\s+(\\d+(?:\\.\\d+)?)\\s*(.*)$/i;",
  "const SUMMARY = /^\\/summary(?:\\s+(\\d{4}-(?:0[1-9]|1[0-2])))?$/i;",
  "const UNDO = /^\\/undo$/i;",
  "const RECENT = /^\\/(?:recent|list)$/i;",
  "const CATEGORIES = /^\\/(?:categories|cats)$/i;",
  "const BUDGETS_LIST = /^\\/budgets$/i;",
  "const BUDGET_SET = /^\\/budget\\s+(.+?)\\s+(\\d+(?:\\.\\d+)?)\\s*$/i;",
  "const GOALS_LIST = /^\\/goals$/i;",
  "const GOAL_NEW = /^\\/goal\\s+(.+)$/i;",
  "const CONTRIBUTE = /^\\/(?:contribute|save)\\s+(.+)$/i;",
  "const RECURRINGS_LIST = /^\\/(?:recurrings|rules)$/i;",
  "const RECURRING_NEW = /^\\/(?:recurring|rule)\\s+(\\d+(?:\\.\\d+)?)\\s+(monthly|quarterly|yearly)\\s+(\\S+)(?:\\s+(.*))?$/i;",
  "const LOANS_LIST = /^\\/loans$/i;",
  "const LOAN_NEW = /^\\/loan\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+)(?:\\s+(.*))?$/i;",
  "const MEMBERS = /^\\/(?:members|family)$/i;",
  "const INVESTMENTS = /^\\/(?:investments|inv)$/i;",
  "const EXPORT = /^\\/(?:export|csv)$/i;",
  "const TAX = /^\\/tax$/i;",
  "const JOIN = /^\\/join(?:@\\w+)?\\s+([A-Za-z0-9]{3,20})/i;",
  "const HELP = /^\\/(help|start)$/i;",
  "const DATE_RE = /^\\d{4}-\\d{2}-\\d{2}$/;",
  "",
  "const out = {",
  "  chatId, tgUserId, userId, today, month, monthStart, monthEnd,",
  "  tgUsername: msg.from.username || '',",
  "  intent: 'unknown', replyText: FALLBACK_TEXT,",
  "};",
  "",
  "const e = text.match(EXPENSE);",
  "if (e) {",
  "  const amount = parseFloat(e[1]);",
  "  const rest = e[2].trim();",
  "  const rm = rest.match(/^(\\S+)(?:\\s+(.*))?$/);",
  "  out.intent = 'expense_text';",
  "  out.amount = amount;",
  "  out.rawCategory = rm ? rm[1] : rest;",
  "  out.note = rm && rm[2] ? rm[2] : '';",
  "  out.date = today;",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "const i = text.match(INCOME);",
  "if (i) {",
  "  out.intent = 'income_text';",
  "  out.amount = parseFloat(i[1]);",
  "  out.note = (i[2] || '').trim() || 'Income';",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
"const s = text.match(SUMMARY);",
  "if (s) {",
  "  out.intent = 'summary';",
  "  if (s[1]) {",
  "    const mp = s[1].split('-').map(Number);",
  "    out.month = s[1];",
  "    out.monthStart = s[1] + '-01';",
  "    out.monthEnd = s[1] + '-' + String(new Date(Date.UTC(mp[0], mp[1], 0)).getUTCDate()).padStart(2, '0');",
  "  }",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "const j = text.match(JOIN);",
  "if (j) {",
  "  out.intent = 'join';",
  "  out.inviteCode = j[1].toUpperCase().replace(/[^A-Z0-9]/g, '');",
  "  if (out.inviteCode) return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "// ---- Feature commands ----",
  "if (UNDO.test(text)) { out.intent = 'undo'; return [{ json: out, binary: items[0].binary }]; }",
  "if (RECENT.test(text)) { out.intent = 'recent'; return [{ json: out, binary: items[0].binary }]; }",
  "if (CATEGORIES.test(text)) { out.intent = 'categories_list'; return [{ json: out, binary: items[0].binary }]; }",
  "if (BUDGETS_LIST.test(text)) { out.intent = 'budgets_list'; return [{ json: out, binary: items[0].binary }]; }",
  "if (GOALS_LIST.test(text)) { out.intent = 'goals_list'; return [{ json: out, binary: items[0].binary }]; }",
  "if (RECURRINGS_LIST.test(text)) { out.intent = 'recurrings_list'; return [{ json: out, binary: items[0].binary }]; }",
  "if (LOANS_LIST.test(text)) { out.intent = 'loans_list'; return [{ json: out, binary: items[0].binary }]; }",
  "if (MEMBERS.test(text)) { out.intent = 'members'; return [{ json: out, binary: items[0].binary }]; }",
  "if (INVESTMENTS.test(text)) { out.intent = 'investments'; return [{ json: out, binary: items[0].binary }]; }",
  "if (EXPORT.test(text)) { out.intent = 'export_csv'; return [{ json: out, binary: items[0].binary }]; }",
  "if (TAX.test(text)) { out.intent = 'help'; out.replyText = TAX_HINT; return [{ json: out, binary: items[0].binary }]; }",
  "",
  "const b = text.match(BUDGET_SET);",
  "if (b) {",
  "  out.intent = 'budget_set';",
  "  out.budgetCategory = b[1].trim();",
  "  out.budgetAmount = parseFloat(b[2]);",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "const g = text.match(GOAL_NEW);",
  "if (g) {",
  "  const tokens = g[1].trim().split(/\\s+/);",
  "  let targetDate = '';",
  "  if (tokens.length >= 3 && DATE_RE.test(tokens[tokens.length - 1])) targetDate = tokens.pop();",
  "  const amount = parseFloat(tokens[tokens.length - 1]);",
  "  if (!isNaN(amount) && tokens.length >= 2) {",
  "    tokens.pop();",
  "    out.intent = 'goal_new';",
  "    out.goalName = tokens.join(' ');",
  "    out.goalAmount = amount;",
  "    out.goalDate = targetDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];",
  "    return [{ json: out, binary: items[0].binary }];",
  "  }",
  "  out.intent = 'help';",
  "  out.replyText = 'Usage: /goal [name] [amount] [YYYY-MM-DD]\\nExample: /goal laptop 80000 2027-06-01';",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "const ct = text.match(CONTRIBUTE);",
  "if (ct) {",
  "  const tokens = ct[1].trim().split(/\\s+/);",
  "  const amount = parseFloat(tokens[tokens.length - 1]);",
  "  if (!isNaN(amount) && tokens.length >= 2) {",
  "    tokens.pop();",
  "    out.intent = 'contribute';",
  "    out.goalMatch = tokens.join(' ');",
  "    out.goalAmount = amount;",
  "    return [{ json: out, binary: items[0].binary }];",
  "  }",
  "  out.intent = 'help';",
  "  out.replyText = 'Usage: /contribute [goal name] [amount]\\nExample: /contribute laptop 5000';",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "const rr = text.match(RECURRING_NEW);",
  "if (rr) {",
  "  out.intent = 'recurring_new';",
  "  out.recAmount = parseFloat(rr[1]);",
  "  out.recFreq = rr[2].toLowerCase();",
  "  out.recCategory = rr[3];",
  "  out.recLabel = (rr[4] || '').trim();",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "const ln = text.match(LOAN_NEW);",
  "if (ln) {",
  "  out.intent = 'loan_new';",
  "  out.loanPrincipal = parseFloat(ln[1]);",
  "  out.loanRate = parseFloat(ln[2]);",
  "  out.loanMonths = parseInt(ln[3], 10);",
  "  out.loanLabel = (ln[4] || 'Loan').trim();",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "if (HELP.test(text)) {",
  "  out.intent = 'help';",
  "  out.replyText = HELP_TEXT;",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "if (photoFileId) {",
  "  out.intent = 'photo';",
  "  out.photoFileId = photoFileId;",
  "  out.mediaGroupId = mediaGroupId;",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "// New bot commands: /edit <field> <value>, /ask <question>, /setup-menu",
  "const ed = text.match(/^\\/edit\\s+(amount|note|category|date)\\s+(.+)$/i);",
  "if (ed) {",
  "  out.intent = 'edit';",
  "  out.editField = ed[1].toLowerCase();",
  "  out.editValue = ed[2].trim();",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "const ak = text.match(/^\\/ask\\s+(.+)$/i);",
  "if (ak) {",
  "  out.intent = 'ask';",
  "  out.askQuestion = ak[1].trim();",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "if (/^\\/setup-menu$/i.test(text)) {",
  "  out.intent = 'setup_menu';",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "// Natural-language expense logging: plain (non-slash) short text goes to",
  "// the Gemini parser instead of the fallback message.",
  "if (!text.startsWith('/') && text.length > 2 && text.length <= 120) {",
  "  out.intent = 'nl_parse';",
  "  out.nlText = text;",
  "  return [{ json: out, binary: items[0].binary }];",
  "}",
  "",
  "// Unrecognized slash-command: echo the raw text (escaped) so invisible",
  "// characters and formatting become visible for debugging.",
  "if (text.startsWith('/')) {",
  "  out.replyText = FALLBACK_TEXT + '\\n\\n(received: ' + JSON.stringify(text) + ')';",
  "}",
  "return [{ json: out, binary: items[0].binary }];",
].join("\n");

const extractImageCode = [
  "const classify = $('Classify Update').first().json;",
  "",
  "if (!items[0].binary || !items[0].binary.data) {",
  "  return [{ json: { scanOK: false, error: 'Photo download from Telegram failed - send the receipt again as a photo', chatId: classify.chatId, userId: classify.userId } }];",
  "}",
  "",
  "const buf = await this.helpers.getBinaryDataBuffer(0, 'data');",
  "const mimeType = items[0].binary.data.mimeType || 'image/jpeg';",
  "const imageBase64 = buf.toString('base64');",
  "",
  "// Diagnostics + guard: if the downloaded image is tiny or doesn't look like",
  "// a real image, fail loudly instead of letting Gemini hallucinate a receipt.",
  "const imgBytes = buf.length;",
  "const headHex = buf.slice(0, 8).toString('hex');",
  "const looksLikeImage = /^ffd8ff/.test(headHex) || /^89504e47/.test(headHex) || /^464f52/.test(headHex) || /^424d/.test(headHex);",
  "if (imgBytes < 1000 || !looksLikeImage) {",
  "  return [{ json: { scanOK: false, error: 'Downloaded image is invalid (' + imgBytes + ' bytes, starts with ' + headHex + ')', chatId: classify.chatId, userId: classify.userId } }];",
  "}",
  "",
  "// Build the full Gemini request body here (plain JS, no n8n expression restrictions)",
  "const RECEIPT_PROMPT = [",
  "  'You are a precise receipt data extraction engine. Read the attached receipt image and extract exactly four fields.',",
  "  '',",
  "  'FIELD 1 - amount: the GRAND TOTAL the customer actually paid - the final amount after taxes, discounts and all charges.',",
  "  'It is usually near the bottom of the receipt, labeled TOTAL, GRAND TOTAL, NET AMOUNT, NET PAYABLE, BILL AMOUNT or PAID.',",
  "  'NEVER return: a subtotal, an individual line-item price, a quantity, a phone number, an order/invoice number, a date, a GST/tax percentage, or a loyalty point value.',",
  "  'Return a plain number without currency symbols, commas or spaces (examples: 1450.5 or 1450.50).',",
  "  '',",
  "  'FIELD 2 - date: the purchase/transaction date PRINTED on the receipt, formatted exactly YYYY-MM-DD (empty string if not visible).',",
  "  'If several dates appear, use the order/purchase date - never a due date, expiry date or delivery date.',",
  "  'Read the date carefully digit by digit; do not guess or invent a date.',",
  "  '',",
  "  'FIELD 3 - merchant: the store/merchant name as printed at the top of the receipt - no addresses, phone numbers or taglines (empty string if not visible).',",
  "  '',",
  "  'FIELD 4 - category: classify this purchase into exactly ONE of these categories:',",
  "  'Rent, EMI, SIP/Investments, Investments, Mutual Funds, Stocks, Fixed Deposits, Groceries, Utilities, Mobile Recharge, Transport, Dining Out, Domestic Help, Insurance Premium, Medical, Education, Subscriptions, Festivals & Gifts, Travel, Shopping, Miscellaneous.',",
  "  'Pick the closest match for what was purchased overall (a grocery store receipt is Groceries even if it contains snacks).',",
  "].join('\\n');",
  "",
  "const geminiBody = JSON.stringify({",
  "  contents: [{",
  "    parts: [",
  "      { inline_data: { mime_type: mimeType, data: imageBase64 } },",
  "      { text: RECEIPT_PROMPT },",
  "    ],",
  "  }],",
  "  generationConfig: {",
  "    responseMimeType: 'application/json',",
  "    temperature: 0,",
  "    responseSchema: {",
  "      type: 'OBJECT',",
  "      properties: {",
  "        amount: { type: 'NUMBER', description: 'Grand total paid, plain number, no symbols' },",
  "        date: { type: 'STRING', description: 'Purchase date printed on the receipt as YYYY-MM-DD, empty string if not visible' },",
  "        merchant: { type: 'STRING', description: 'Store name as printed, empty string if not visible' },",
  "        category: { type: 'STRING', description: 'Exactly one of the provided categories' },",
  "      },",
  "      required: ['amount', 'date', 'merchant', 'category'],",
  "    },",
  "  },",
  "});",
  "",
  "return [{ json: { imageBase64, mimeType, chatId: classify.chatId, userId: classify.userId, mediaGroupId: classify.mediaGroupId || '', geminiBody, debug: { imgBytes, base64Len: imageBase64.length, headHex } } }];",
].join("\n");

const parseScanCode = [
  "const classify = $('Classify Update').first().json;",
  "",
  "let scanOK = false;",
  "let amount = 0;",
  "let date = '';",
  "let merchant = '';",
  "let category = '';",
  "let error = '';",
  "let dateAdjusted = false;",
  "let originalDate = '';",
  "",
  "try {",
  "  const j = items[0].json;",
  "  // If the Gemini HTTP call itself failed (onError: continue passes {error} here),",
  "  // surface the REAL cause instead of the downstream JSON.parse message.",
  "  if (j && j.error && !j.candidates) {",
  "    const upstream = String(j.error);",
  "    if (/429/.test(upstream)) {",
  "      error = 'Gemini free-tier rate limit hit - wait about a minute, then send the photo again';",
  "    } else if (/40[0134]/.test(upstream)) {",
  "      error = 'Gemini API rejected the request: ' + upstream.slice(0, 180);",
  "    } else {",
  "      error = upstream.slice(0, 180);",
  "    }",
  "  } else {",
  "    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];",
  "    let text = parts.map(p => p.text || '').join('');",
  "    text = text.replace(/```json\\s*/gi, '').replace(/```/g, '').trim();",
  "    const parsed = JSON.parse(text);",
  "    amount = Number(parsed.amount);",
  "    date = String(parsed.date || '').trim();",
  "    merchant = String(parsed.merchant || '').trim();",
  "    category = String(parsed.category || '').trim();",
  "  }",
  "} catch (e) {",
  "  error = (e && e.message) ? e.message : 'Failed to parse scan result';",
  "}",
  "",
  "// Amount sanity: reject obvious misreads (line items, phone numbers, tax IDs)",
  "if (!error && (!isFinite(amount) || amount <= 0)) {",
  "  error = 'No valid amount found on receipt';",
  "} else if (!error && amount > 5000000) {",
  "  error = 'Amount looks wrong (over 50 lakh) - re-check with a clearer photo';",
  "}",
  "",
  "// Merchant sanity: drop placeholder junk Gemini sometimes echoes",
  "if (/^(store name|merchant|merchant name|n\\/?a|na|none|unknown|\\-+|\\.*|\\s*)$/i.test(merchant)) {",
  "  merchant = '';",
  "}",
  "",
  "// Date sanity: valid format, not far in the past, not in the future.",
  "// The website dashboard is month-scoped, so stale/future dates are filed under today instead.",
  "originalDate = date;",
  "const nowTs = new Date(classify.today + 'T00:00:00Z').getTime();",
  "const SIXTY_DAYS = 60 * 24 * 3600 * 1000;",
  "if (/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {",
  "  const ts = new Date(date + 'T00:00:00Z').getTime();",
  "  if (!isNaN(ts) && (ts < nowTs - SIXTY_DAYS || ts > nowTs + 2 * 24 * 3600 * 1000)) {",
  "    date = classify.today;",
  "    dateAdjusted = true;",
  "  }",
  "} else {",
  "  date = classify.today; // missing or malformed date -> silent fallback",
  "}",
  "",
  "scanOK = !error;",
  "",
  "return [{ json: { scanOK, amount, date, merchant, category, error, dateAdjusted, originalDate, chatId: classify.chatId, userId: classify.userId } }];",
].join("\n");

const collectCategoriesCode = [
  "const DEFAULT_CATEGORIES = [",
  "  'Rent', 'EMI', 'SIP/Investments', 'Investments', 'Mutual Funds', 'Stocks', 'Fixed Deposits',",
  "  'Groceries', 'Utilities', 'Mobile Recharge', 'Transport', 'Dining Out', 'Domestic Help',",
  "  'Insurance Premium', 'Medical', 'Education', 'Subscriptions', 'Festivals & Gifts', 'Travel',",
  "  'Shopping', 'Miscellaneous',",
  "];",
  "",
  "const classify = $('Classify Update').first().json;",
  "",
  "// Default payload: expense entered as text",
  "let payload = {",
  "  userId: classify.userId,",
  "  chatId: classify.chatId,",
  "  amount: classify.amount,",
  "  rawCategory: classify.rawCategory,",
  "  note: classify.note,",
  "  txDate: classify.date,",
  "  source: 'telegram',",
  "  dateAdjusted: false,",
  "  originalDate: '',",
  "};",
  "",
  "// If this run came from a receipt photo, prefer the scanned values.",
  "// The pro-model retry (if it ran) wins over the first flash attempt.",
  "let scan = null;",
  "try {",
  "  const s2 = $('Parse Scan Fallback').first().json;",
  "  if (s2 && s2.scanOK) scan = s2;",
  "} catch (e) { /* pro attempt did not run in this execution */ }",
  "if (!scan) {",
  "  try {",
  "    const s1 = $('Parse Scan').first().json;",
  "    if (s1 && s1.scanOK) scan = s1;",
  "  } catch (e) { /* text path: no scan in this execution */ }",
  "}",
  "if (scan) {",
  "  payload = {",
  "    userId: scan.userId,",
  "    chatId: scan.chatId,",
  "    amount: scan.amount,",
  "    rawCategory: scan.category || 'Other',",
  "    note: scan.merchant || 'Telegram receipt',",
  "    txDate: scan.date,",
  "    merchant: scan.merchant,",
  "    source: 'telegram_receipt',",
  "    dateAdjusted: !!scan.dateAdjusted,",
  "    originalDate: scan.originalDate || '',",
  "  };",
  "}",
  "// Confirmed receipt (inline Save button) - payload parked in static data",
  "if (!scan) {",
  "  try {",
  "    const rc = $('Read Callback').first().json;",
  "    if (rc && rc.cbAction === 'save' && rc.userId) {",
  "      payload = {",
  "        userId: rc.userId,",
  "        chatId: rc.chatId,",
  "        amount: rc.amount,",
  "        rawCategory: rc.rawCategory,",
  "        note: rc.note,",
  "        txDate: rc.txDate,",
  "        merchant: rc.merchant,",
  "        source: 'telegram_receipt',",
  "        dateAdjusted: !!rc.dateAdjusted,",
  "        originalDate: rc.originalDate || '',",
  "      };",
  "    }",
  "  } catch (e) { /* not a callback run */ }",
  "}",
  "// Natural-language parsed expense",
  "if (!scan) {",
  "  try {",
  "    const nl = $('Parse NL').first().json;",
  "    if (nl && nl.nlParsed) {",
  "      payload = {",
  "        userId: nl.userId,",
  "        chatId: nl.chatId,",
  "        amount: nl.amount,",
  "        rawCategory: nl.rawCategory,",
  "        note: nl.note,",
  "        txDate: nl.txDate,",
  "        merchant: '',",
  "        source: 'telegram',",
  "        dateAdjusted: false,",
  "        originalDate: '',",
  "      };",
  "    }",
  "  } catch (e) { /* not an NL run */ }",
  "}",
  "",
  "// Merge Firestore categories (raw REST format) with the built-in defaults",
  "const names = DEFAULT_CATEGORIES.slice();",
  "for (const it of items) {",
  "  const d = (it.json && it.json.document) ? it.json.document : null;",
  "  const f = (d && d.fields) ? d.fields : null;",
  "  const name = (f && f.name && f.name.stringValue) ? f.name.stringValue : null;",
  "  if (name && !names.some(n => n.toLowerCase() === name.toLowerCase())) names.push(name);",
  "}",
  "",
  "return [{ json: Object.assign({}, payload, { categories: names }) }];",
].join("\n");

const buildTransactionCode = [
  "const p = $('Collect Categories').first().json;",
  "",
  "let householdId = null;",
  "try {",
  "  const d = (items[0].json && items[0].json.document) ? items[0].json.document : null;",
  "  householdId = (d && d.fields && d.fields.household_id) ? d.fields.household_id.stringValue : null;",
  "} catch (e) { householdId = null; }",
  "",
  "const cats = p.categories || [];",
  "const raw = (p.rawCategory || 'Other').toString().trim();",
  "const combined = (raw + ' ' + (p.note || '')).trim().toLowerCase();",
  "",
  "// 1) Match a known category as a prefix of \"&lt;category&gt; <note>\" (supports multi-word categories)",
  "let finalCategory = null;",
  "let matchedWords = 0;",
  "for (const c of cats) {",
  "  if (combined.startsWith(c.toLowerCase())) {",
  "    finalCategory = c;",
  "    matchedWords = c.toLowerCase().split(/\\s+/).length;",
  "    break;",
  "  }",
  "}",
  "",
  "// 2) Exact single-word match",
  "if (!finalCategory) {",
  "  for (const c of cats) {",
  "    if (c.toLowerCase() === raw.toLowerCase()) { finalCategory = c; matchedWords = 1; break; }",
  "  }",
  "}",
  "",
  "// 3) Custom category: capitalize + collect suggestions",
"let suggestions = '';",
  "if (!finalCategory) {",
  "  finalCategory = raw.charAt(0).toUpperCase() + raw.slice(1);",
  "  matchedWords = 1;",
  "  const low = raw.toLowerCase();",
  "  const close = [];",
  "  for (const c of cats) {",
  "    const cl = c.toLowerCase();",
  "    let n = 0;",
  "    while (n < cl.length && n < low.length && cl.charAt(n) === low.charAt(n)) n++;",
  "    if (n >= Math.max(3, Math.floor(low.length * 0.6))) close.push(c);",
  "  }",
  "  if (close.length > 0) suggestions = close.slice(0, 4).join(', ');",
  "}",
  "",
  "// Recompute the note: whatever follows the matched category words",
  "let note;",
  "if (p.source === 'telegram_receipt') {",
  "  note = p.merchant || p.note || 'Telegram receipt';",
  "} else {",
  "  const words = combined.split(/\\s+/);",
  "  note = words.slice(matchedWords).join(' ').trim() || (p.note || '') || finalCategory || 'Telegram entry';",
  "}",
  "",
"// Build the Firestore REST document body with EXPLICIT field types.",
  "// CRITICAL: date must be stringValue - the n8n Firestore node auto-converts",
  "// date-like strings to timestamps, which breaks the web app's string range queries.",
  "const amountField = Number.isInteger(p.amount) ? { integerValue: String(p.amount) } : { doubleValue: p.amount };",
  "const txFields = {",
  "  user_id: { stringValue: p.userId },",
  "  ...(householdId ? { household_id: { stringValue: householdId } } : {}),",
  "  category_id: { stringValue: finalCategory },",
  "  amount: amountField,",
  "  date: { stringValue: p.txDate },",
  "  note: { stringValue: note },",
  "  payment_mode: { stringValue: 'UPI' },",
  "  source: { stringValue: p.source },",
  "  created_at: { timestampValue: new Date().toISOString() },",
  "};",
  "const firestoreBody = JSON.stringify({ fields: txFields });",
  "",
  "return [{ json: {",
  "  docId: 'tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10),",
  "  user_id: p.userId,",
  "  household_id: householdId,",
  "  category_id: finalCategory,",
  "  amount: p.amount,",
  "  date: p.txDate,",
  "  note,",
  "  payment_mode: 'UPI',",
  "  source: p.source,",
  "  created_at: new Date().toISOString(),",
  "  chatId: p.chatId,",
  "  suggestions,",
  "  date_adjusted: !!p.dateAdjusted,",
  "  original_date: p.originalDate || '',",
  "  firestoreBody,",
  "} }];",
].join("\n");

const buildBudgetQueryCode = [
  "const c = $('Classify Update').first().json;",
  "const t = $('Build Transaction').first().json;",
  "// When the sender is linked to a household, budget warnings must count the",
  "// WHOLE household's spend in that category (matching the website's Budgets",
  "// tab), not just this sender's - otherwise multi-member warnings mislead.",
  "let hhId = '';",
  "try {",
  "  const hub = $('Query Household').first().json;",
  "  hhId = (hub && hub.document && hub.document.fields && hub.document.fields.household_id) ? hub.document.fields.household_id.stringValue : '';",
  "} catch (e) { hhId = ''; }",
  "",
  "return [{ json: {",
  "  userId: c.userId,",
  "  chatId: c.chatId,",
  "  month: c.month,",
  "  monthStart: c.monthStart,",
  "  monthEnd: c.monthEnd,",
  "  category: t.category_id,",
  "  amount: t.amount,",
  "  suggestions: t.suggestions || '',",
  "  qValue: hhId || c.userId,",
  "  qField: hhId ? 'household_id' : 'user_id',",
  "  hhLinked: !!hhId,",
  "} }];",
].join("\n");

const collectBudgetsCode = [
  "const prev = $('Build Budget Query').first().json;",
  "",
  "const budgets = [];",
  "for (const it of items) {",
  "  const d = (it.json && it.json.document) ? it.json.document : null;",
  "  const f = (d && d.fields) ? d.fields : null;",
  "  if (f) {",
  "    const lim = f.limit_amount ? Number(f.limit_amount.doubleValue !== undefined ? f.limit_amount.doubleValue : f.limit_amount.integerValue) : 0;",
  "    budgets.push({",
  "      category_id: (f.category_id && f.category_id.stringValue) ? f.category_id.stringValue : null,",
  "      limit: lim || 0,",
  "      household_id: (f.household_id && f.household_id.stringValue) ? f.household_id.stringValue : null,",
  "      user_id: (f.user_id && f.user_id.stringValue) ? f.user_id.stringValue : null,",
  "    });",
  "  }",
  "}",
  "",
  "return [{ json: Object.assign({}, prev, { budgets }) }];",
].join("\n");

const budgetCheckReplyCode = [
  "const c = $('Classify Update').first().json;",
  "const b = $('Collect Budgets').first().json;",
  "const t = $('Build Transaction').first().json;",
  "// HTML-escape user-derived text for Telegram parse_mode=HTML replies",
  "function escTx(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (ch) { return '&' + '#' + ch.charCodeAt(0) + ';'; }); }",
  "",
  "// Sum this month's spend in the same category",
  "let spent = 0;",
  "for (const it of items) {",
  "  const d = (it.json && it.json.document) ? it.json.document : null;",
  "  const f = (d && d.fields) ? d.fields : null;",
  "  if (!f) continue;",
  "  const date = (f.date && f.date.stringValue) ? f.date.stringValue : '';",
  "  if (date < b.monthStart || date > b.monthEnd) continue;",
  "  const cat = (f.category_id && f.category_id.stringValue) ? f.category_id.stringValue : null;",
  "  if (cat === t.category_id) {",
  "    spent += f.amount ? Number(f.amount.doubleValue !== undefined ? f.amount.doubleValue : f.amount.integerValue) : 0;",
  "  }",
  "}",
  "",
  "let reply = '\\u2705 <b>Expense Logged</b>\\n\u{1F4B0} Amount: \\u20B9' + t.amount + '\\n\u{1F4C2} Category: ' + escTx(t.category_id);",
  "if (t.note) reply += '\\n\u{1F4DD} Note: ' + escTx(t.note);",
  "reply += '\\n\u{1F4C5} Date: ' + t.date;",
  "if (t.suggestions) reply += '\\n\u{1F4A1} Did you mean: ' + escTx(t.suggestions) + '? (saved as ' + escTx(t.category_id) + ')';",
  "if (t.date_adjusted) reply += '\\n\u{2139}\uFE0F Receipt was dated ' + t.original_date + ' - logged under today instead.';",
  "if (!t.household_id) reply += '\\n\\u2139\\uFE0F <i>Not linked to any household - this entry will NOT show on the website. Send /join with an invite code from the Family tab to link.</i>';",
  "",
  "const budget = (b.budgets || []).find(x => x.category_id === t.category_id && x.limit > 0);",
  "if (budget) {",
  "  const pct = (spent / budget.limit) * 100;",
  "  if (spent > budget.limit) {",
  "    reply += '\\n\u{1F6A8} <b>Over budget!</b> \\u20B9' + spent.toFixed(2) + ' of \\u20B9' + budget.limit + ' (' + pct.toFixed(0) + '%) spent in ' + escTx(t.category_id) + ' this month' + (b.hhLinked ? ' (household-wide)' : '') + '.';",
  "  } else if (pct >= 80) {",
  "    reply += '\\n\\u26A0\\uFE0F <b>' + pct.toFixed(0) + '% of budget used</b> \\u2014 \\u20B9' + spent.toFixed(2) + ' of \\u20B9' + budget.limit + ' in ' + escTx(t.category_id) + ' this month' + (b.hhLinked ? ' (household-wide)' : '') + '.';",
  "  }",
  "}",
  "",
  "return [{ json: { replyText: reply, chatId: c.chatId } }];",
].join("\n");

const buildIncomeEntryCode = [
  "const c = $('Classify Update').first().json;",
  "",
  "let householdId = null;",
  "try {",
  "  const d = (items[0].json && items[0].json.document) ? items[0].json.document : null;",
  "  householdId = (d && d.fields && d.fields.household_id) ? d.fields.household_id.stringValue : null;",
  "} catch (e) { householdId = null; }",
  "",
  "const doc = {",
  "  user_id: c.userId,",
  "  household_id: householdId,",
  "  month: c.month,",
  "  basic: 0,",
  "  hra: 0,",
  "  special_allowance: 0,",
  "  bonus: 0,",
  "  other: c.amount,",
  "  epf_deduction: 0,",
  "  professional_tax: 0,",
  "  tds: 0,",
  "  net_credited: c.amount,",
  "  created_at: new Date().toISOString(),",
  "};",
  "",
  "  const reply = '\\u2705 <b>Income Logged</b>\\n\u{1F4B0} Amount: \\u20B9' + c.amount + '\\n\u{1F4DD} ' + String(c.note).replace(/[&<>]/g, function (ch) { return '&' + '#' + ch.charCodeAt(0) + ';'; }) + '\\n\u{1F4C5} Month: ' + c.month + (householdId ? '' : '\\n\\u2139\\uFE0F <i>Not linked to any household - this entry will NOT show on the website. Send /join with an invite code from the Family tab to link.</i>');",
  "",
  "const docId = 'tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);",
  "",
  "// Firestore REST body with EXPLICIT types (month must stay stringValue)",
  "const amountField = Number.isInteger(c.amount) ? { integerValue: String(c.amount) } : { doubleValue: c.amount };",
  "const incomeFields = {",
  "  user_id: { stringValue: c.userId },",
  "  ...(householdId ? { household_id: { stringValue: householdId } } : {}),",
  "  month: { stringValue: c.month },",
  "  basic: { integerValue: '0' },",
  "  hra: { integerValue: '0' },",
  "  special_allowance: { integerValue: '0' },",
  "  bonus: { integerValue: '0' },",
  "  other: amountField,",
  "  epf_deduction: { integerValue: '0' },",
  "  professional_tax: { integerValue: '0' },",
  "  tds: { integerValue: '0' },",
  "  net_credited: amountField,",
  "  created_at: { timestampValue: new Date().toISOString() },",
  "};",
  "const firestoreBody = JSON.stringify({ fields: incomeFields });",
  "",
  "return [{ json: Object.assign({}, doc, { docId, firestoreBody, replyText: reply, chatId: c.chatId }) }];",
].join("\n");

const validateInviteCode = [
  "// Input: raw Firestore query rows for invites matching the code (or one empty marker row)",
  "const c = $('Classify Update').first().json;",
  "",
  "let invite = null;",
  "for (const it of items) {",
  "  const d = (it.json && it.json.document) ? it.json.document : null;",
  "  const f = (d && d.fields) ? d.fields : null;",
  "  if (f) {",
  "    invite = {",
  "      id: d.id || null,",
  "      household_id: (f.household_id && f.household_id.stringValue) ? f.household_id.stringValue : null,",
  "      role: (f.role && f.role.stringValue) ? f.role.stringValue : null,",
  "      status: (f.status && f.status.stringValue) ? f.status.stringValue : null,",
  "      expires_at: (f.expires_at && (f.expires_at.timestampValue || f.expires_at.stringValue)) ? (f.expires_at.timestampValue || f.expires_at.stringValue) : null,",
  "    };",
  "  }",
  "}",
  "",
  "let valid = false;",
  "let reply = '';",
  "",
  "if (!invite) {",
  "  reply = '\\u274C Invite code not found. Generate a fresh code on the website: Family tab \\u2192 Invite Family Member.';",
  "} else if (invite.status !== 'pending') {",
  "  reply = '\\u274C This invite code has already been used.';",
  "} else if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {",
  "  reply = '\\u274C This invite code has expired. Generate a fresh code on the website: Family tab \\u2192 Invite Family Member.';",
  "} else {",
  "  valid = true;",
  "  reply = '\\u2705 <b>Linked to your household!</b>\\nFrom now on, expenses and income logged via this bot will show up on the website dashboard.';",
  "}",
  "",
  "if (!valid) {",
  "  return [{ json: { valid, replyText: reply, chatId: c.chatId } }];",
  "}",
  "",
  "const email = c.tgUsername ? '@' + c.tgUsername : c.userId;",
  "",
  "return [{ json: {",
  "  valid: true,",
  "  chatId: c.chatId,",
  "  replyText: reply,",
  "  documentId: c.userId,",
  "  user_id: c.userId,",
  "  household_id: invite.household_id,",
  "  email,",
  "  role: invite.role || 'other',",
  "  custom_role_description: null,",
  "  joined_at: new Date().toISOString(),",
  "  inviteDocId: invite.id,",
  "  status: 'accepted',",
  "} }];",
].join("\n");

const buildSummaryReplyCode = [
  "const p = $('Collect Summary Tx').first().json;",
  "const c = $('Classify Update').first().json;",
  "",
  "// incomes (input items, month-filtered)",
  "let income = 0;",
  "for (const it of items) {",
  "  const d = (it.json && it.json.document) ? it.json.document : null;",
  "  const f = (d && d.fields) ? d.fields : null;",
  "  if (!f) continue;",
  "  if ((f.month && f.month.stringValue ? f.month.stringValue : '') !== c.month) continue;",
  "  income += f.net_credited ? Number(f.net_credited.doubleValue !== undefined ? f.net_credited.doubleValue : f.net_credited.integerValue || 0) : 0;",
  "}",
  "",
  "const total = p.totalSpend;",
  "const count = p.txCount;",
  "const byCat = p.byCat || {};",
  "const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5)",
  "  .map((kv, idx) => (idx + 1) + '. ' + String(kv[0]).replace(/[&<>]/g, function (ch) { return '&' + '#' + ch.charCodeAt(0) + ';'; }) + ': \\u20B9' + kv[1].toFixed(2)).join('\\n');",
  "",
  "const savings = income - total;",
  "const rate = income > 0 ? Math.round(savings / income * 100) : null;",
  "let reply = '\\u{1F4CA} <b>Summary \\u2014 ' + c.month + '</b>\\n\\n';",
  "reply += '\\u{1F4B8} Spent: \\u20B9' + total.toFixed(2) + ' (' + count + ' transaction' + (count === 1 ? '' : 's') + ')\\n';",
  "reply += '\\u{1F4B0} Income: \\u20B9' + income.toFixed(2) + '\\n';",
  "reply += '\\u{1F4B8} Savings: \\u20B9' + savings.toFixed(2) + (rate !== null ? ' (' + rate + '%)' : '') + '\\n\\n';",
  "reply += '<b>Top categories:</b>\\n' + (top || 'No expenses logged this month.');",
  "",
  "return [{ json: { replyText: reply, chatId: c.chatId } }];",
].join("\n");

// ---------- Feature-command Code scripts ----------

// Shared helpers used by several scripts below (kept as an ARRAY so the
// `...restRowHelper` spread in code arrays inserts lines, not characters)
const restRowHelper = [
  "// Read one REST-format doc row (from Firestore query nodes, simple:false)",
  "function row(it) { const d = (it.json && it.json.document) ? it.json.document : null; return (d && d.fields) ? { id: d.id, f: d.fields } : null; }",
  "function sv(f, key) { return (f && f[key] && f[key].stringValue !== undefined) ? f[key].stringValue : ''; }",
  "function num(f, key) { const v = f && f[key]; if (!v) return 0; return Number(v.doubleValue !== undefined ? v.doubleValue : v.integerValue || 0); }",
  "function ts(f, key) { const v = f && f[key]; return v ? (v.timestampValue || v.stringValue || '') : ''; }",
  "function bool(f, key) { const v = f && f[key]; return v ? v.booleanValue === true : false; }",
  "// HTML-escape user-derived text for Telegram parse_mode=HTML replies",
  "// (numeric character references, built at runtime)",
  "function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return '&' + '#' + c.charCodeAt(0) + ';'; }); }",
  "// CSV cell sanitizer - neutralize spreadsheet formula injection (=,+,-,@)",
  "function csvCell(v) { const s = String(v == null ? '' : v); return /^[=+\\-@\\t\\r]/.test(s) ? \"'\" + s : s; }",
];

const buildUndoCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'undo') return [];",
  "",
  ...restRowHelper,
  "let latest = null, latestTs = '';",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  const cat = ts(r.f, 'created_at');",
  "  if (cat >= latestTs) { latestTs = cat; latest = r; }",
  "}",
  "if (!latest) {",
  "  return [{ json: { chatId: c.chatId, replyText: 'You have no logged entries to delete.' } }];",
  "}",
  "return [{ json: {",
  "  deleteDocId: latest.id,",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 Deleted: ' + esc(sv(latest.f, 'category_id')) + ' \\u20B9' + num(latest.f, 'amount') + ' (' + sv(latest.f, 'date') + ')',",
  "} }];",
].join("\n");

const buildRecentReplyCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'recent') return [];",
  "",
  ...restRowHelper,
  "const txs = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; txs.push(r); }",
  "txs.sort((a, b) => (ts(b.f, 'created_at') || '').localeCompare(ts(a.f, 'created_at') || ''));",
  "const top = txs.slice(0, 10);",
  "if (top.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No entries yet. Log one with /spent or send a receipt photo.' } }];",
  "const lines = top.map((r) => sv(r.f, 'date') + ' \\u20B9' + num(r.f, 'amount') + ' ' + esc(sv(r.f, 'category_id')) + (sv(r.f, 'note') ? ' (' + esc(sv(r.f, 'note').slice(0, 24)) + ')' : ''));",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F4CB} <b>Last ' + top.length + ' entries</b>\\n' + lines.join('\\n') } }];",
].join("\n");

const buildExportCsvCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'export_csv') return [];",
  "",
  ...restRowHelper,
  "const rows = [['date', 'category', 'amount', 'note', 'source']];",
  "let count = 0;",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  const d = sv(r.f, 'date');",
  "  if (d < c.monthStart || d > c.monthEnd) continue;",
  "  count++;",
  "  rows.push([csvCell(d), csvCell(sv(r.f, 'category_id')), csvCell(num(r.f, 'amount')), csvCell(String(sv(r.f, 'note')).replace(/[\\r\\n,]+/g, ' ')), csvCell(sv(r.f, 'source'))]);",
  "}",
  "if (count === 0) return [{ json: { chatId: c.chatId, replyText: 'No entries in ' + c.month + ' to export.' } }];",
  "const csv = rows.map((r) => r.join(',')).join('\\n');",
  "const binaryData = Buffer.from('\\uFEFF' + csv, 'utf8').toString('base64');",
  "return [{ json: { chatId: c.chatId, fileName: 'transactions_' + c.month + '.csv', count }, binary: { data: { data: binaryData, mimeType: 'text/csv', fileName: 'transactions_' + c.month + '.csv' } } }];",
].join("\n");

const buildCategoriesReplyCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const defaults = ['Rent','EMI','SIP/Investments','Investments','Mutual Funds','Stocks','Fixed Deposits','Groceries','Utilities','Mobile Recharge','Transport','Dining Out','Domestic Help','Insurance Premium','Medical','Education','Subscriptions','Festivals & Gifts','Travel','Shopping','Miscellaneous'];",
  "const names = defaults.slice();",
  "for (const it of items) { const r = row(it); if (!r) continue; const n = sv(r.f, 'name'); if (n && !names.some(x => x.toLowerCase() === n.toLowerCase())) names.push(n); }",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F4C2} <b>Valid categories</b>\\n' + names.map(esc).join(', ') } }];",
].join("\n");

const buildBudgetSetCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "let hhId = '';",
  "try { const hub = $('Query Household (Hub)').first().json; hhId = (hub && hub.document && hub.document.fields && hub.document.fields.household_id) ? hub.document.fields.household_id.stringValue : ''; } catch (e) { hhId = ''; }",
  "",
  "// Resolve category against known names (prefix match, like the expense path)",
  "const defaults = ['Rent','EMI','SIP/Investments','Investments','Mutual Funds','Stocks','Fixed Deposits','Groceries','Utilities','Mobile Recharge','Transport','Dining Out','Domestic Help','Insurance Premium','Medical','Education','Subscriptions','Festivals & Gifts','Travel','Shopping','Miscellaneous'];",
  "const raw = c.budgetCategory || '';",
  "const combined = (raw + ' ' + (c.note || '')).trim().toLowerCase();",
  "let category = null;",
  "for (const cat of defaults) { if (combined.startsWith(cat.toLowerCase())) { category = cat; break; } }",
  "if (!category) { for (const cat of defaults) { if (cat.toLowerCase() === raw.toLowerCase()) { category = cat; break; } } }",
  "if (!category) category = raw.charAt(0).toUpperCase() + raw.slice(1);",
  "",
  "// Find an existing budget doc for this category+month in the right scope",
  "let existingId = '';",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  if (sv(r.f, 'category_id') !== category || sv(r.f, 'month') !== c.month) continue;",
  "  const bHh = sv(r.f, 'household_id');",
  "  if (hhId ? bHh === hhId : !bHh) { existingId = r.id; break; }",
  "}",
  "",
  "const amountField = Number.isInteger(c.budgetAmount) ? { integerValue: String(c.budgetAmount) } : { doubleValue: c.budgetAmount };",
  "const docBase = 'projects/gen-lang-client-0213350901/databases/ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5/documents';",
  "let writes;",
  "if (existingId) {",
  "  writes = [{ update: { name: docBase + '/budgets/' + existingId, fields: { limit_amount: amountField } }, updateMask: { fieldPaths: ['limit_amount'] } }];",
  "} else {",
  "  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');",
  "  const docId = (c.userId + '_' + c.month + '_' + slug).toLowerCase();",
  "  const fields = {",
  "    user_id: { stringValue: c.userId },",
  "    ...(hhId ? { household_id: { stringValue: hhId } } : {}),",
  "    category_id: { stringValue: category },",
  "    month: { stringValue: c.month },",
  "    limit_amount: amountField,",
  "    created_at: { timestampValue: new Date().toISOString() },",
  "  };",
  "  writes = [{ update: { name: docBase + '/budgets/' + docId, fields }, updateMask: { fieldPaths: Object.keys(fields) } }];",
  "}",
  "return [{ json: {",
  "  batchBody: { writes },",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 <b>Budget set</b>\\n\\u{1F4C2} ' + esc(category) + ': \\u20B9' + c.budgetAmount + ' for ' + c.month + (existingId ? ' (updated existing)' : '') + (hhId ? '\\nVisible to your whole household on the website.' : ''),",
  "} }];",
].join("\n");

const prepScopedQueryCode = [
  "// Prepare a scoped query: household_id when linked, user_id otherwise.",
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "let hhId = '';",
  "try { const hub = $('Query Household (Hub)').first().json; hhId = (hub && hub.document && hub.document.fields && hub.document.fields.household_id) ? hub.document.fields.household_id.stringValue : ''; } catch (e) { hhId = ''; }",
  "return [{ json: { qValue: hhId || c.userId, qField: hhId ? 'household_id' : 'user_id', chatId: c.chatId, month: c.month, monthStart: c.monthStart, monthEnd: c.monthEnd, userId: c.userId } }];",
].join("\n");

const collectBudgetsListCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const budgets = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; budgets.push({ id: r.id, category_id: sv(r.f, 'category_id'), limit: num(r.f, 'limit_amount'), month: sv(r.f, 'month'), household_id: sv(r.f, 'household_id') }); }",
  "return [{ json: Object.assign({}, { userId: c.userId, chatId: c.chatId, month: c.month, monthStart: c.monthStart, monthEnd: c.monthEnd }, { budgets }) }];",
].join("\n");

const buildBudgetsReplyCode = [
  "const p = $('Collect Budgets (List)').first().json;",
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const spendByCat = {};",
  "for (const it of items) { const r = row(it); if (!r) continue; const d = sv(r.f, 'date'); if (d < c.monthStart || d > c.monthEnd) continue; const cat = sv(r.f, 'category_id'); spendByCat[cat] = (spendByCat[cat] || 0) + num(r.f, 'amount'); }",
  "const budgets = p.budgets || [];",
  "if (budgets.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No budgets set for ' + c.month + '. Create one: /budget groceries 5000' } }];",
  "const lines = budgets.map((b) => {",
  "  const spent = spendByCat[b.category_id] || 0;",
  "  const pct = b.limit > 0 ? Math.round(spent / b.limit * 100) : 0;",
  "  const icon = spent > b.limit ? '\\u{1F6A8}' : (pct >= 80 ? '\\u26A0\\uFE0F' : '\\u2705');",
  "  return icon + ' ' + esc(b.category_id) + ': \\u20B9' + spent + ' / \\u20B9' + b.limit + ' (' + pct + '%)';",
  "});",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F4D2} <b>Budgets \\u2014 ' + c.month + '</b>\\n\\n' + lines.join('\\n') } }];",
].join("\n");

const buildGoalCode = [
  "const c = $('Classify Update').first().json;",
  "let hhId = '';",
  "try { const hub = $('Query Household (Hub)').first().json; hhId = (hub && hub.document && hub.document.fields && hub.document.fields.household_id) ? hub.document.fields.household_id.stringValue : ''; } catch (e) { hhId = ''; }",
  "const fields = {",
  "  user_id: { stringValue: c.userId },",
  "  ...(hhId ? { household_id: { stringValue: hhId } } : {}),",
  "  name: { stringValue: c.goalName },",
  "  target_amount: { doubleValue: c.goalAmount },",
  "  target_date: { stringValue: c.goalDate },",
  "  current_amount: { doubleValue: 0 },",
  "  linked_recurring_rule_id: { nullValue: null },",
  "  created_at: { timestampValue: new Date().toISOString() },",
  "};",
  "return [{ json: {",
  "  collection: 'goals',",
  "  docId: 'tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10),",
  "  firestoreBody: JSON.stringify({ fields }),",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 <b>Goal created</b>\\n\\u{1F3AF} ' + esc(c.goalName) + ': \\u20B9' + c.goalAmount + ' by ' + c.goalDate + '\\nAdd money with /contribute ' + c.goalName.toLowerCase().split(' ')[0] + ' [amount]',",
  "} }];",
].join("\n");

const buildContributeCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'contribute') return [];",
  ...restRowHelper,
  "const needle = (c.goalMatch || '').toLowerCase();",
  "let goal = null;",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  const name = sv(r.f, 'name').toLowerCase();",
  "  if (name === needle || name.includes(needle) || needle.includes(name)) { goal = { id: r.id, name: sv(r.f, 'name'), current: num(r.f, 'current_amount'), target: num(r.f, 'target_amount') }; break; }",
  "}",
  "if (!goal) return [{ json: { found: false, chatId: c.chatId, replyText: '\\u274C No goal matching \\u201C' + c.goalMatch + '\\u201D. See /goals for your goals.' } }];",
  "const newAmount = Math.round((goal.current + c.goalAmount) * 100) / 100;",
  "const docBase = 'projects/gen-lang-client-0213350901/databases/ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5/documents';",
  "return [{ json: {",
  "  found: true,",
  "  batchBody: { writes: [{ update: { name: docBase + '/goals/' + goal.id, fields: { current_amount: { doubleValue: newAmount } } }, updateMask: { fieldPaths: ['current_amount'] } }] },",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 <b>Contribution added</b>\\n\\u{1F3AF} ' + esc(goal.name) + ': \\u20B9' + newAmount + ' of \\u20B9' + goal.target + ' (' + (goal.target > 0 ? Math.round(newAmount / goal.target * 100) : 0) + '%)',",
  "} }];",
].join("\n");

const buildGoalsReplyCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'goals_list') return [];",
  ...restRowHelper,
  "const goals = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; goals.push({ name: sv(r.f, 'name'), current: num(r.f, 'current_amount'), target: num(r.f, 'target_amount'), date: sv(r.f, 'target_date') }); }",
  "if (goals.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No goals yet. Create one: /goal laptop 80000 2027-06-01' } }];",
  "const lines = goals.map((g) => {",
  "  const pct = g.target > 0 ? Math.round(g.current / g.target * 100) : 0;",
  "  return '\\u{1F3AF} ' + esc(g.name) + ': \\u20B9' + g.current + ' / \\u20B9' + g.target + ' (' + pct + '%) by ' + g.date;",
  "});",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F3AF} <b>Savings goals</b>\\n\\n' + lines.join('\\n') } }];",
].join("\n");

const buildRecurringNewCode = [
  "const c = $('Classify Update').first().json;",
  "let hhId = '';",
  "try { const hub = $('Query Household (Hub)').first().json; hhId = (hub && hub.document && hub.document.fields && hub.document.fields.household_id) ? hub.document.fields.household_id.stringValue : ''; } catch (e) { hhId = ''; }",
  "// Resolve category like the expense path",
  "const defaults = ['Rent','EMI','SIP/Investments','Investments','Mutual Funds','Stocks','Fixed Deposits','Groceries','Utilities','Mobile Recharge','Transport','Dining Out','Domestic Help','Insurance Premium','Medical','Education','Subscriptions','Festivals & Gifts','Travel','Shopping','Miscellaneous'];",
  "let category = defaults.find((x) => x.toLowerCase() === (c.recCategory || '').toLowerCase());",
  "if (!category) category = c.recCategory.charAt(0).toUpperCase() + c.recCategory.slice(1);",
  "const fields = {",
  "  user_id: { stringValue: c.userId },",
  "  ...(hhId ? { household_id: { stringValue: hhId } } : {}),",
  "  category_id: { stringValue: category },",
  "  amount: Number.isInteger(c.recAmount) ? { integerValue: String(c.recAmount) } : { doubleValue: c.recAmount },",
  "  frequency: { stringValue: c.recFreq },",
  "  next_due_date: { stringValue: c.today },",
  "  label: { stringValue: c.recLabel || (category + ' (recurring)') },",
  "  active: { booleanValue: true },",
  "  created_at: { timestampValue: new Date().toISOString() },",
  "};",
  "return [{ json: {",
  "  collection: 'recurring_rules',",
  "  docId: 'tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10),",
  "  firestoreBody: JSON.stringify({ fields }),",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 <b>Recurring rule created</b>\\n\\u{1F501} \\u20B9' + c.recAmount + ' ' + c.recFreq + ' \\u2192 ' + category + '\\nFirst run: today. Rules also appear on the website and run daily.',",
  "} }];",
].join("\n");

const buildRecurringsReplyCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const rules = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; rules.push({ category: sv(r.f, 'category_id'), amount: num(r.f, 'amount'), freq: sv(r.f, 'frequency'), next: sv(r.f, 'next_due_date'), label: sv(r.f, 'label'), active: bool(r.f, 'active') }); }",
  "if (rules.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No recurring rules. Create one: /recurring 1500 monthly groceries' } }];",
  "const lines = rules.map((r) => (r.active ? '\\u2705' : '\\u23F8') + ' \\u20B9' + r.amount + ' ' + r.freq + ' \\u2192 ' + esc(r.category) + (r.label ? ' (' + esc(r.label) + ')' : '') + ' next: ' + r.next);",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F501} <b>Recurring rules</b>\\n\\n' + lines.join('\\n') } }];",
].join("\n");

const buildLoanCode = [
  "const c = $('Classify Update').first().json;",
  "let hhId = '';",
  "try { const hub = $('Query Household (Hub)').first().json; hhId = (hub && hub.document && hub.document.fields && hub.document.fields.household_id) ? hub.document.fields.household_id.stringValue : ''; } catch (e) { hhId = ''; }",
  "",
  "// Mirror of the website's loanUtils.ts",
  "const principal = c.loanPrincipal, rate = c.loanRate, months = c.loanMonths;",
  "if (!(principal > 0) || !(months > 0) || months > 480) {",
  "  return [{ json: { chatId: c.chatId, replyText: 'Invalid loan. Usage: /loan 500000 9.5 60 [label]' } }];",
  "}",
  "const r = rate / 12 / 100;",
  "const emi = rate === 0 ? Math.round(principal / months) : Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));",
  "const loanId = 'tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);",
  "const docBase = 'projects/gen-lang-client-0213350901/databases/ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5/documents';",
  "const now = new Date().toISOString();",
  "",
  "const numField = (v) => Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };",
  "const loanFields = {",
  "  user_id: { stringValue: c.userId },",
  "  ...(hhId ? { household_id: { stringValue: hhId } } : {}),",
  "  principal: numField(principal),",
  "  interest_rate: numField(rate),",
  "  tenure_months: { integerValue: String(months) },",
  "  start_date: { stringValue: c.today },",
  "  emi_amount: { integerValue: String(emi) },",
  "  label: { stringValue: c.loanLabel },",
  "  created_at: { timestampValue: now },",
  "};",
  "const writes = [{ update: { name: docBase + '/loans/' + loanId, fields: loanFields }, updateMask: { fieldPaths: Object.keys(loanFields) } }];",
  "",
  "// Amortization schedule",
  "let balance = principal;",
  "let totalInterest = 0;",
  "for (let m = 1; m <= months; m++) {",
  "  const interest = Math.round(balance * r);",
  "  let prinComp = emi - interest;",
  "  if (m === months || balance < prinComp) prinComp = balance;",
  "  balance -= prinComp;",
  "  totalInterest += interest;",
  "  const sf = {",
  "    loan_id: { stringValue: loanId },",
  "    user_id: { stringValue: c.userId },",
  "    ...(hhId ? { household_id: { stringValue: hhId } } : {}),",
  "    month_number: { integerValue: String(m) },",
  "    principal_component: numField(prinComp),",
  "    interest_component: numField(interest),",
  "    outstanding_balance: numField(Math.max(0, balance)),",
  "    is_prepayment: { booleanValue: false },",
  "  };",
  "  writes.push({ update: { name: docBase + '/loan_schedules/tg' + loanId.slice(2) + '-' + m, fields: sf }, updateMask: { fieldPaths: Object.keys(sf) } });",
  "  if (balance <= 0) break;",
  "}",
  "",
  "// EMI recurring rule (like the website's LoanSection)",
  "const d = new Date();",
  "d.setMonth(d.getMonth() + 1);",
  "const emiNext = d.toISOString().split('T')[0];",
  "const rf = {",
  "  user_id: { stringValue: c.userId },",
  "  ...(hhId ? { household_id: { stringValue: hhId } } : {}),",
  "  category_id: { stringValue: 'EMI' },",
  "  amount: { integerValue: String(emi) },",
  "  frequency: { stringValue: 'monthly' },",
  "  next_due_date: { stringValue: emiNext },",
  "  label: { stringValue: 'Loan EMI - ' + c.loanLabel },",
  "  active: { booleanValue: true },",
  "  created_at: { timestampValue: now },",
  "};",
  "writes.push({ update: { name: docBase + '/recurring_rules/tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), fields: rf }, updateMask: { fieldPaths: Object.keys(rf) } });",
  "",
  "return [{ json: {",
  "  batchBody: { writes },",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 <b>Loan created: ' + c.loanLabel + '</b>\\n\\u{1F4B0} \\u20B9' + principal + ' @ ' + rate + '% for ' + months + ' months\\n\\u{1F4B3} EMI: \\u20B9' + emi + '/month\\n\\u{1F4C9} Total interest: \\u20B9' + totalInterest + '\\n\\u{1F4D6} Full amortization schedule + monthly EMI rule created (visible on the website Loans tab).',",
  "} }];",
].join("\n");

const buildLoansReplyCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const loans = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; loans.push({ label: sv(r.f, 'label') || 'Loan', principal: num(r.f, 'principal'), rate: num(r.f, 'interest_rate'), months: num(r.f, 'tenure_months'), emi: num(r.f, 'emi_amount') }); }",
  "if (loans.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No loans. Create one: /loan 500000 9.5 60 home' } }];",
  "const lines = loans.map((l) => '\\u{1F4B3} ' + esc(l.label) + ': \\u20B9' + l.principal + ' @ ' + l.rate + '% \\u00D7 ' + l.months + 'm \\u2014 EMI \\u20B9' + l.emi);",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F4B3} <b>Loans</b>\\n\\n' + lines.join('\\n') + '\\n\\nAmortization details on the website Loans tab.' } }];",
].join("\n");

const buildMembersReplyCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const members = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; members.push({ email: sv(r.f, 'email'), role: sv(r.f, 'role') }); }",
  "if (members.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No household members found. Link the bot first: /join [invite code]' } }];",
  "const lines = members.map((m) => (m.role === 'primary' ? '\\u{1F451} ' : '\\u{1F464} ') + esc(m.email) + ' (' + esc(m.role) + ')');",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F46A} <b>Household members</b>\\n\\n' + lines.join('\\n') } }];",
].join("\n");

const buildInvestmentsReplyCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const accounts = [];",
  "for (const it of items) { const r = row(it); if (!r) continue; accounts.push({ name: sv(r.f, 'name'), type: sv(r.f, 'type') || sv(r.f, 'custom_type_description'), folio: sv(r.f, 'folio_number') }); }",
  "if (accounts.length === 0) return [{ json: { chatId: c.chatId, replyText: 'No investment accounts. Add them on the website Investments tab (bot is read-only here).' } }];",
  "const lines = accounts.map((a) => '\\u{1F4B0} ' + esc(a.name) + ' [' + esc(a.type) + ']' + (a.folio ? ' (' + esc(a.folio) + ')' : ''));",
  "return [{ json: { chatId: c.chatId, replyText: '\\u{1F4BC} <b>Investment accounts</b>\\n\\n' + lines.join('\\n') + '\\n\\nHoldings & valuations on the website Investments tab.' } }];",
].join("\n");

const collectSummaryTxCode = [
  "const c = $('Classify Update').first().json;",
  ...restRowHelper,
  "const byCat = {};",
  "let total = 0, count = 0;",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  const d = sv(r.f, 'date');",
  "  if (d < c.monthStart || d > c.monthEnd) continue;",
  "  const amt = num(r.f, 'amount');",
  "  const cat = sv(r.f, 'category_id') || 'Other';",
  "  total += amt; count++;",
  "  byCat[cat] = (byCat[cat] || 0) + amt;",
  "}",
  "return [{ json: { userId: c.userId, chatId: c.chatId, month: c.month, monthStart: c.monthStart, monthEnd: c.monthEnd, totalSpend: total, txCount: count, byCat } }];",
].join("\n");

const processRecurringCode = [
  "// Daily recurring processor (runs from the Schedule Trigger for ALL users)",
  ...restRowHelper,
  "const today = new Date().toISOString().split('T')[0];",
  "const docBase = 'projects/gen-lang-client-0213350901/databases/ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5/documents';",
  "const writes = [];",
  "let processed = 0;",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  const next = sv(r.f, 'next_due_date');",
  "  if (!next || next > today) continue;",
  "  if (!bool(r.f, 'active')) continue;",
  "  const ruleId = r.id;",
  "  const txFields = {",
  "    user_id: { stringValue: sv(r.f, 'user_id') },",
  "    ...(sv(r.f, 'household_id') ? { household_id: { stringValue: sv(r.f, 'household_id') } } : {}),",
  "    category_id: { stringValue: sv(r.f, 'category_id') },",
  "    amount: num(r.f, 'amount') % 1 === 0 ? { integerValue: String(num(r.f, 'amount')) } : { doubleValue: num(r.f, 'amount') },",
  "    date: { stringValue: next },",
  "    note: { stringValue: sv(r.f, 'label') || 'Recurring' },",
  "    payment_mode: { stringValue: 'UPI' },",
  "    source: { stringValue: 'recurring' },",
  "    created_at: { timestampValue: new Date().toISOString() },",
  "  };",
  "  writes.push({ update: { name: docBase + '/transactions/tg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10), fields: txFields }, updateMask: { fieldPaths: Object.keys(txFields) } });",
  "  const d = new Date(next + 'T00:00:00Z');",
  "  if (sv(r.f, 'frequency') === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1);",
  "  else if (sv(r.f, 'frequency') === 'quarterly') d.setUTCMonth(d.getUTCMonth() + 3);",
  "  else if (sv(r.f, 'frequency') === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1);",
  "  writes.push({ update: { name: docBase + '/recurring_rules/' + ruleId, fields: { next_due_date: { stringValue: d.toISOString().split('T')[0] } } }, updateMask: { fieldPaths: ['next_due_date'] } });",
  "  processed++;",
  "}",
  "if (processed === 0) return [];",
  "return [{ json: { batchBody: { writes }, processed } }];",
].join("\n");

// ---------- New bot feature Code scripts ----------

// Receipt scan confirmation: instead of auto-writing, park the scan in the
// workflow's static data and reply with inline Save/Discard buttons.
const buildScanConfirmationCode = [
  "const c = $('Classify Update').first().json;",
  "// Prefer the pro-fallback scan result when present",
  "let scan = null;",
  "try { const s2 = $('Parse Scan Fallback').first().json; if (s2 && s2.scanOK) scan = s2; } catch (e) {}",
  "if (!scan) { try { const s1 = $('Parse Scan').first().json; if (s1 && s1.scanOK) scan = s1; } catch (e) {} }",
  "if (!scan) return [];",
  "",
  "// esc for Telegram HTML",
  "function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (ch) { return '&' + '#' + ch.charCodeAt(0) + ';'; }); }",
  "",
  "const payload = {",
  "  userId: scan.userId,",
  "  chatId: scan.chatId,",
  "  amount: scan.amount,",
  "  rawCategory: scan.category || 'Other',",
  "  note: scan.merchant || 'Telegram receipt',",
  "  txDate: scan.date,",
  "  merchant: scan.merchant,",
  "  source: 'telegram_receipt',",
  "  dateAdjusted: !!scan.dateAdjusted,",
  "  originalDate: scan.originalDate || '',",
  "};",
  "",
  "const staticData = $getWorkflowStaticData('global');",
  "if (!staticData.pendingScans) staticData.pendingScans = {};",
  "// cleanup entries older than 1 hour, cap total",
  "const cutoff = Date.now() - 3600 * 1000;",
  "for (const k of Object.keys(staticData.pendingScans)) {",
  "  if ((staticData.pendingScans[k].created || 0) < cutoff) delete staticData.pendingScans[k];",
  "}",
  "const keys = Object.keys(staticData.pendingScans);",
  "while (keys.length >= 20) { delete staticData.pendingScans[keys.shift()]; }",
  "",
  "const saveId = 'sc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);",
  "staticData.pendingScans[saveId] = { payload, created: Date.now() };",
  "",
  "let reply = '\\u{1F50D} <b>Receipt scanned - save it?</b>\\n\\u{1F4B0} ' + scan.amount + '\\n\\U{1F4C2} ' + esc(scan.category || 'Other') + (scan.merchant ? '\\n\\U{1F3EA} ' + esc(scan.merchant) : '') + '\\n\\U{1F4C5} ' + scan.date;",
  "if (scan.dateAdjusted) reply += '\\n\\u2139\\uFE0F (receipt dated ' + scan.originalDate + ' - will be saved under today)';",
  "reply += '\\n\\n\\u2705 Save or \\u274C Discard below. To fix a value first, send /edit after saving.';",
  "",
  "return [{ json: { chatId: c.chatId, replyText: reply, saveId, cbAction: 'none' } }];",
].join("\n");

const readCallbackCode = [
  "const c = $('Classify Update').first().json;",
  "const staticData = $getWorkflowStaticData('global');",
  "const pending = (staticData.pendingScans || {})[c.cbId];",
  "// remove immediately so double-taps can't double-write",
  "if (staticData.pendingScans && staticData.pendingScans[c.cbId]) delete staticData.pendingScans[c.cbId];",
  "",
  "if (!pending) {",
  "  return [{ json: { cbAction: 'none', chatId: c.chatId, replyText: 'That scan has already been processed or expired. Send the receipt photo again.' } }];",
  "}",
  "if (c.cbAction === 'save') {",
  "  return [{ json: Object.assign({}, pending.payload, { cbAction: 'save' }) }];",
  "}",
  "if (c.cbAction === 'discard') {",
  "  return [{ json: { cbAction: 'none', chatId: c.chatId, replyText: '\\u274C Receipt scan discarded.' } }];",
  "}",
  "return [{ json: { cbAction: 'none', chatId: c.chatId, replyText: 'Unknown button action.' } }];",
].join("\n");

const buildNlPromptCode = [
  "const c = $('Classify Update').first().json;",
  "const today = c.today;",
  "// Strict extraction prompt; user text is embedded JSON-stringified so it",
  "// cannot inject instructions into the prompt.",
  "const sys = [",
  "  'You convert a short personal-finance note into structured data.',",
  "  'Rules:',",
  "  '- type: \"expense\" for spending, \"income\" for money received, \"none\" if the text is not about a transaction.',",
  "  '- amount: the number mentioned (strip currency symbols/commas). 0 if none.',",
  "  '- category: exactly one of: Rent, EMI, SIP/Investments, Investments, Mutual Funds, Stocks, Fixed Deposits, Groceries, Utilities, Mobile Recharge, Transport, Dining Out, Domestic Help, Insurance Premium, Medical, Education, Subscriptions, Festivals \u0026 Gifts, Travel, Shopping, Miscellaneous.',",
  "  '- note: any descriptor after the amount/category (merchant, what for). Empty string if none.',",
  "  '- date: YYYY-MM-DD if a day is mentioned (today = ' + JSON.stringify(today) + '), otherwise empty string.',",
  "  'User note:',",
  "].join('\\\\n');",
  "const nlBody = JSON.stringify({",
  "  contents: [{ parts: [{ text: sys + ' ' + JSON.stringify(c.nlText) }] }],",
  "  generationConfig: {",
  "    responseMimeType: 'application/json',",
  "    temperature: 0,",
  "    responseSchema: {",
  "      type: 'OBJECT',",
  "      properties: {",
  "        type: { type: 'STRING', description: 'expense, income, or none' },",
  "        amount: { type: 'NUMBER', description: 'transaction amount, 0 if absent' },",
  "        category: { type: 'STRING', description: 'one of the provided categories' },",
  "        note: { type: 'STRING', description: 'short descriptor, empty if none' },",
  "        date: { type: 'STRING', description: 'YYYY-MM-DD or empty string' },",
  "      },",
  "      required: ['type', 'amount', 'category', 'note', 'date'],",
  "    },",
  "  },",
  "});",
  "return [{ json: { chatId: c.chatId, userId: c.userId, today: c.today, nlBody } }];",
].join("\n");

const parseNlCode = [
  "const c = $('Classify Update').first().json;",
  "let type = 'none', amount = 0, category = '', note = '', date = '';",
  "try {",
  "  const j = items[0].json;",
  "  const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];",
  "  let text = parts.map(p => p.text || '').join('');",
  "  text = text.replace(/```json\\s*/gi, '').replace(/```/g, '').trim();",
  "  const parsed = JSON.parse(text);",
  "  type = String(parsed.type || 'none').toLowerCase();",
  "  amount = Number(parsed.amount) || 0;",
  "  category = String(parsed.category || '');",
  "  note = String(parsed.note || '');",
  "  date = String(parsed.date || '');",
  "} catch (e) { type = 'none'; }",
  "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) date = '';",
  "",
  "if (type === 'expense' && amount > 0) {",
  "  return [{ json: {",
  "    nlParsed: true, cbAction: 'save',",
  "    userId: c.userId, chatId: c.chatId,",
  "    amount, rawCategory: category || 'Other',",
  "    note: note || 'Voice/text entry',",
  "    txDate: date || c.today,",
  "    merchant: '', source: 'telegram',",
  "    dateAdjusted: false, originalDate: '',",
  "  } }];",
  "}",
  "if (type === 'income' && amount > 0) {",
  "  return [{ json: { chatId: c.chatId, replyText: '\\U{1F4B0} Income detected: \\u20B9' + amount + '. Log it with: /earned ' + amount + (note ? ' ' + note : '') } }];",
  "}",
  "return [{ json: { chatId: c.chatId, replyText: 'I could not read that as an expense. Try /spent [amount] [category], e.g. /spent 250 groceries - or /help.' } }];",
].join("\n");

const buildEditCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'edit') return [];",
  ...restRowHelper,
  "// find the sender's most recent transaction",
  "let latest = null, latestTs = '';",
  "for (const it of items) { const r = row(it); if (!r) continue; const cat = ts(r.f, 'created_at'); if (cat >= latestTs) { latestTs = cat; latest = r; } }",
  "if (!latest) return [{ json: { chatId: c.chatId, replyText: 'You have no entries to edit yet.' } }];",
  "",
  "const field = c.editField;",
  "const value = c.editValue;",
  "let updFields = {};",
  "let summary = '';",
  "if (field === 'amount') {",
  "  const n = parseFloat(value.replace(/[^0-9.]/g, ''));",
  "  if (!(n > 0)) return [{ json: { chatId: c.chatId, replyText: 'Invalid amount. Usage: /edit amount 500' } }];",
  "  updFields.amount = Number.isInteger(n) ? { integerValue: String(n) } : { doubleValue: n };",
  "  summary = '\\u20B9' + n;",
  "} else if (field === 'note') {",
  "  updFields.note = { stringValue: value.slice(0, 120) };",
  "  summary = '\"' + value.slice(0, 40) + '\"';",
  "} else if (field === 'category') {",
  "  const defaults = ['Rent','EMI','SIP/Investments','Investments','Mutual Funds','Stocks','Fixed Deposits','Groceries','Utilities','Mobile Recharge','Transport','Dining Out','Domestic Help','Insurance Premium','Medical','Education','Subscriptions','Festivals & Gifts','Travel','Shopping','Miscellaneous'];",
  "  let cat = defaults.find((x) => x.toLowerCase() === value.toLowerCase());",
  "  if (!cat) cat = value.charAt(0).toUpperCase() + value.slice(1);",
  "  updFields.category_id = { stringValue: cat };",
  "  summary = cat;",
  "} else if (field === 'date') {",
  "  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return [{ json: { chatId: c.chatId, replyText: 'Invalid date. Use YYYY-MM-DD: /edit date 2026-10-09' } }];",
  "  updFields.date = { stringValue: value };",
  "  summary = value;",
  "}",
  "",
  "const docBase = 'projects/gen-lang-client-0213350901/databases/ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5/documents';",
  "return [{ json: {",
  "  batchBody: { writes: [{ update: { name: docBase + '/transactions/' + latest.id, fields: updFields }, updateMask: { fieldPaths: Object.keys(updFields) } }] },",
  "  chatId: c.chatId,",
  "  replyText: '\\u2705 Updated last entry (' + sv(latest.f, 'category_id') + ' \\u20B9' + num(latest.f, 'amount') + '): ' + field + ' \\u2192 ' + summary,",
  "} }];",
].join("\n");

const buildAskContextCode = [
  "const c = $('Classify Update').first().json;",
  "if (c.intent !== 'ask') return [];",
  ...restRowHelper,
  "// Collect the sender's transactions from the last 12 months (newest first)",
  "const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().split('T')[0];",
  "const rows = [];",
  "for (const it of items) {",
  "  const r = row(it);",
  "  if (!r) continue;",
  "  const d = sv(r.f, 'date');",
  "  if (d < cutoff) continue;",
  "  rows.push({ d, a: num(r.f, 'amount'), c: sv(r.f, 'category_id'), n: sv(r.f, 'note').slice(0, 30) });",
  "}",
  "rows.sort((x, y) => y.d.localeCompare(x.d));",
  "const capped = rows.slice(0, 600);",
  "const dataStr = capped.length === 0",
  "  ? '(no transactions logged)'",
  "  : 'date\\tamount\\tcategory\\tnote\\n' + capped.map((x) => x.d + '\\t' + x.a + '\\t' + x.c + '\\t' + x.n).join('\\n');",
  "",
  "const sys = [",
  "  'You are a personal finance assistant. Answer the user question using ONLY the transaction data below. Amounts are INR. Be concise (max 6 lines). If the data cannot answer it, say so. Do not invent numbers.',",
  "  'TRANSACTION DATA (most recent first):',",
  "  dataStr,",
  "  'QUESTION:',",
  "].join('\\\\n');",
  "const askBody = JSON.stringify({",
  "  contents: [{ parts: [{ text: sys + ' ' + JSON.stringify(c.askQuestion) }] }],",
  "  generationConfig: { temperature: 0 },",
  "});",
  "return [{ json: { chatId: c.chatId, askBody, rowCount: capped.length } }];",
].join("\n");

const buildAskReplyCode = [
  "const c = $('Classify Update').first().json;",
  "let answer = '';",
  "try {",
  "  const j = items[0].json;",
  "  const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];",
  "  answer = parts.map(p => p.text || '').join('').trim();",
  "} catch (e) { answer = ''; }",
  "if (!answer) answer = 'Sorry - I could not produce an answer. Try rephrasing your question.';",
  "// Escape for Telegram HTML, then restore safe bold markers",
  "function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (ch) { return '&' + '#' + ch.charCodeAt(0) + ';'; }); }",
  "return [{ json: { chatId: c.chatId, replyText: '\\U{1F9EE} ' + esc(answer) } }];",
].join("\n");

// ---------- nodes ----------

const nodes = [
  // Trigger
  {
    id: uid(),
    name: "Telegram Trigger",
    type: "n8n-nodes-base.telegramTrigger",
    typeVersion: 1.5,
    position: [-80, 340],
    webhookId: uid(),
    parameters: {
      updates: ["message", "callback_query"],
      // SECURITY: only this Telegram account may invoke the bot. Replace with
      // your own Telegram user ID (get it from @userinfobot) if you fork this.
      // NOTE: "Download Images/Files" stays OFF on purpose - n8n's imageSize
      // picker falls back to the tiny ~90px thumbnail when Telegram sends fewer
      // sizes; the "Get Telegram Photo" node downloads the largest variant.
      additionalFields: {
        userIds: "7682242660",
      },
    },
  },

  codeNode("Classify Update", [140, 340], classifyCode),

  // Switch
  {
    id: uid(),
    name: "Route by Intent",
    type: "n8n-nodes-base.switch",
    typeVersion: 3.2,
    position: [360, 340],
    parameters: {
      rules: {
        values: [
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "expense_text", "rule-expense")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Expense Text",
          },
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "photo", "rule-photo")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Receipt Photo",
          },
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "income_text", "rule-income")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Income",
          },
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "summary", "rule-summary")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Summary",
          },
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "help", "rule-help")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Help",
          },
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "join", "rule-join")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Join",
          },
          ...["undo", "recent", "categories_list", "budget_set", "budgets_list", "goal_new", "contribute", "goals_list", "recurring_new", "recurrings_list", "loan_new", "loans_list", "members", "investments", "export_csv", "edit", "ask", "setup_menu", "nl_parse", "callback"].map((it, idx) => ({
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", it, "rule-" + it + "-" + idx)],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: it,
          })),
          {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
              conditions: [condEquals("={{ $json.intent }}", "unknown", "rule-unknown")],
              combinator: "and",
            },
            renameOutput: true,
            outputKey: "Unknown",
          },
        ],
      },
      options: {},
    },
  },

  // ---- Receipt photo branch (Get Telegram Photo runs FIRST - downloads the
  // largest photo variant via the bot API, avoiding the trigger's thumbnail fallback) ----
  {
    id: uid(),
    name: "Get Telegram Photo",
    type: "n8n-nodes-base.telegram",
    typeVersion: 1.2,
    position: [620, 60],
    parameters: {
      resource: "file",
      operation: "get",
      fileId: "={{ $('Classify Update').first().json.photoFileId }}",
      download: true,
      additionalFields: {},
    },
  },
  codeNode("Extract Image", [840, 60], extractImageCode),
  {
    id: uid(),
    name: "Image OK?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [1060, 60],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
        conditions: [
          {
            id: "cond-image-ok",
            leftValue: "={{ $json.imageBase64 }}",
            rightValue: "",
            operator: { type: "string", operation: "exists", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  {
    id: uid(),
    name: "Gemini Scan",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [1500, 60],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    onError: "continueRegularOutput",
    parameters: {
      method: "POST",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $('Extract Image').first().json.geminiBody }}",
      options: {},
    },
  },
  telegramSendNode(
    "Processing Receipt",
    [1280, 60],
    "={{ $json.chatId }}",
    "\u{1F4F8} Processing receipt..."
  ),
  codeNode("Parse Scan", [1720, 60], parseScanCode),
  {
    id: uid(),
    name: "Scan OK?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [1940, 60],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
        conditions: [
          {
            id: "cond-scan-ok",
            leftValue: "={{ $json.scanOK }}",
            rightValue: true,
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  {
    id: uid(),
    name: "Gemini Scan Fallback",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [1500, 180],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    onError: "continueRegularOutput",
    parameters: {
      method: "POST",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $('Extract Image').first().json.geminiBody }}",
      options: {},
    },
  },
  codeNode("Parse Scan Fallback", [1720, 180], parseScanCode),
  {
    id: uid(),
    name: "Scan OK Fallback?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [1940, 180],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
        conditions: [
          {
            id: "cond-scan-ok-2",
            leftValue: "={{ $json.scanOK }}",
            rightValue: true,
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  telegramSendNode(
    "Reply Scan Failed",
    [2160, 300],
    "={{ $json.chatId }}",
    "={{ \"\\u274C Couldn't extract data from this receipt. Please try a clearer photo, or send it as a photo (not as a file).\" + ($json.error ? \"\\n\\nReason: \" + $json.error : \"\") }}"
  ),

  // ---- Receipt confirmation (inline keyboard) ----
  codeNode("Build Scan Confirmation", [2160, 60], buildScanConfirmationCode),
  {
    id: uid(),
    name: "Send Scan Confirmation",
    type: "n8n-nodes-base.telegram",
    typeVersion: 1.2,
    position: [2380, 60],
    parameters: {
      resource: "message",
      operation: "sendMessage",
      chatId: "={{ $json.chatId }}",
      text: "={{ $json.replyText }}",
      additionalFields: {
        appendAttribution: false,
        parse_mode: "HTML",
        replyMarkup: {
          values: {
            replyMarkup: "inlineKeyboard",
            inlineKeyboard: {
              rows: [
                {
                  row: {
                    buttons: [
                      {
                        text: "\u2705 Save",
                        additionalFields: {
                          callback_data: "={{ 'scan:save:' + $json.saveId }}",
                        },
                      },
                      {
                        text: "\u274C Discard",
                        additionalFields: {
                          callback_data: "={{ 'scan:discard:' + $json.saveId }}",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
  },

  // ---- Callback handling (button presses) ----
  {
    id: uid(),
    name: "Answer Callback",
    type: "n8n-nodes-base.telegram",
    typeVersion: 1.2,
    position: [620, 1180],
    parameters: {
      resource: "callback",
      operation: "answerQuery",
      queryId: "={{ $json.queryId }}",
      additionalFields: {},
    },
  },
  codeNode("Read Callback", [840, 1180], readCallbackCode),
  ifTrueNode("Is Save?", [1060, 1180], "cond-cb-save", "={{ $json.cbAction }}"),
  telegramSendNode(
    "Reply Callback Result",
    [1280, 1280],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),

  // ---- Natural-language logging ----
  codeNode("Build NL Prompt", [620, 1320], buildNlPromptCode),
  {
    id: uid(),
    name: "Gemini NL Parse",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [840, 1320],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    onError: "continueRegularOutput",
    parameters: {
      method: "POST",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $json.nlBody }}",
      options: {},
    },
  },
  codeNode("Parse NL", [1060, 1320], parseNlCode),
  ifTrueNode("NL Expense?", [1280, 1320], "cond-nl-expense", "={{ $json.nlParsed }}"),

  // ---- /edit last entry ----
  codeNode("Build Edit", [1060, 1440], buildEditCode),
  fsBatchWriteNode("Write Edit", [1280, 1440]),
  telegramSendNode(
    "Reply Edit",
    [1500, 1440],
    "={{ $('Build Edit').first().json.chatId }}",
    "={{ $('Build Edit').first().json.replyText }}"
  ),

  // ---- /ask (chat with your data) ----
  codeNode("Build Ask Context", [1060, 1560], buildAskContextCode),
  {
    id: uid(),
    name: "Gemini Ask",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [1280, 1560],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    onError: "continueRegularOutput",
    parameters: {
      method: "POST",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ $json.askBody }}",
      options: {},
    },
  },
  codeNode("Build Ask Reply", [1500, 1560], buildAskReplyCode),

  // ---- /setup-menu (registers Telegram's native command menu) ----
  {
    id: uid(),
    name: "Register Bot Menu",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [840, 1700],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    parameters: {
      method: "POST",
      url: "={{ 'https://api.telegram.org/bot' + $env.TELEGRAM_BOT_TOKEN + '/setMyCommands' }}",
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        '{"commands":[' +
        '{"command":"spent","description":"Log an expense: /spent 250 groceries"},' +
        '{"command":"earned","description":"Log income: /earned 50000 salary"},' +
        '{"command":"undo","description":"Delete my last entry"},' +
        '{"command":"edit","description":"Edit last entry: /edit amount 500"},' +
        '{"command":"summary","description":"Month spend + income breakdown"},' +
        '{"command":"recent","description":"My last 10 entries"},' +
        '{"command":"budgets","description":"Budget vs spend"},' +
        '{"command":"budget","description":"Set budget: /budget groceries 5000"},' +
        '{"command":"goals","description":"Savings goals"},' +
        '{"command":"goal","description":"Create a goal"},' +
        '{"command":"contribute","description":"Add money to a goal"},' +
        '{"command":"loans","description":"Loans and EMI"},' +
        '{"command":"loan","description":"Create a loan + schedule"},' +
        '{"command":"recurrings","description":"Recurring rules"},' +
        '{"command":"recurring","description":"Create a recurring rule"},' +
        '{"command":"members","description":"Household members"},' +
        '{"command":"investments","description":"Investment accounts"},' +
        '{"command":"categories","description":"Valid categories"},' +
        '{"command":"export","description":"CSV of this month"},' +
        '{"command":"ask","description":"Ask your data: /ask how much on medical?"},' +
        '{"command":"join","description":"Link to your household"},' +
        '{"command":"help","description":"Show all commands"}]}',
      options: {},
    },
  },
  telegramSendNode(
    "Reply Menu",
    [1060, 1700],
    "={{ $('Classify Update').first().json.chatId }}",
    "={{ '\\u2705 Command menu registered - open the / button in Telegram! (May take a moment to appear; reopen the chat if not.)' }}"
  ),

  // ---- Album handling: suppress the per-photo 'Processing...' spam ----
  {
    id: uid(),
    name: "Is Album Photo?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [1060, 60],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
        conditions: [
          {
            id: "cond-album",
            leftValue: "={{ $json.mediaGroupId }}",
            rightValue: "",
            operator: { type: "string", operation: "empty", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },


  // ---- Shared expense pipeline (text + receipt) ----
  fsQueryNode("Query Categories", [760, -140], queryCategoriesJson, paramsUserIdAndSystem),
  codeNode("Collect Categories", [980, -140], collectCategoriesCode),
  fsQueryNode("Query Household", [1200, -140], queryHouseholdJson, paramsUserId),
  codeNode("Build Transaction", [1420, -140], buildTransactionCode),
  fsHttpCreateNode("Create Transaction", [1640, -140], "transactions"),
  codeNode("Build Budget Query", [1860, -140], buildBudgetQueryCode),
  fsQueryNode("Query Budgets", [2080, -140], queryBudgetsJson, paramsMonth),
  codeNode("Collect Budgets", [2300, -140], collectBudgetsCode),
  fsQueryNode("Query Month Transactions (Budget)", [2520, -140], scopedQueryJson("transactions"), paramsScoped),
  codeNode("Budget Check & Reply", [2740, -140], budgetCheckReplyCode),
  telegramSendNode(
    "Send Expense Reply",
    [2960, -140],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),

  // ---- Income branch ----
  fsQueryNode("Query Household (Income)", [620, 620], queryHouseholdJson, paramsUserId),
  codeNode("Build Income Entry", [840, 620], buildIncomeEntryCode),
  fsHttpCreateNode("Create Income Entry", [1060, 620], "income_entries"),
  telegramSendNode(
    "Reply Income",
    [1280, 620],
    "={{ $('Build Income Entry').first().json.chatId }}",
    "={{ $('Build Income Entry').first().json.replyText }}"
  ),

  // ---- Summary branch ----
  fsQueryNode("Query Month Transactions (Summary)", [620, 800], queryUserTransactionsJson, paramsUserId),
  codeNode("Collect Summary Tx", [840, 800], collectSummaryTxCode),
  fsQueryNode("Query Month Incomes", [1060, 800], queryUserIncomesJson, paramsUserId),
  codeNode("Build Summary Reply", [1280, 800], buildSummaryReplyCode),
  telegramSendNode(
    "Send Summary Reply",
    [1500, 800],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),

  // ---- Join household branch (links the Telegram user to the web app household) ----
  fsQueryNode("Query Invites", [620, -420], queryInvitesJson, paramsInviteCode),
  codeNode("Validate Invite", [840, -420], validateInviteCode),
  {
    id: uid(),
    name: "Invite Valid?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [1060, -420],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
        conditions: [
          {
            id: "cond-invite-valid",
            leftValue: "={{ $json.valid }}",
            rightValue: true,
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  fsUpsertNode(
    "Create or Update Membership",
    [1280, -420],
    "household_members",
    "documentId",
    "user_id,household_id,email,role,custom_role_description,joined_at"
  ),
  fsUpsertNode(
    "Mark Invite Accepted",
    [1500, -420],
    "invites",
    "inviteDocId",
    "status",
    { onError: "continueRegularOutput" }
  ),
  telegramSendNode(
    "Reply Join Success",
    [1720, -420],
    "={{ $('Validate Invite').first().json.chatId }}",
    "={{ $('Validate Invite').first().json.replyText }}"
  ),
  telegramSendNode(
    "Reply Join Failed",
    [1280, -300],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),

  // ---- Feature commands: shared query for undo/recent/export ----
  fsQueryNode("Query My Transactions", [620, 460], queryUserTransactionsJson, paramsUserId),
  codeNode("Build Undo", [840, 460], buildUndoCode),
  fsDeleteNode("Delete Last Transaction", [1060, 460]),
  telegramSendNode(
    "Reply Undo",
    [1280, 460],
    "={{ $('Build Undo').first().json.chatId }}",
    "={{ $('Build Undo').first().json.replyText }}"
  ),
  codeNode("Build Recent Reply", [840, 600], buildRecentReplyCode),
  codeNode("Build Export CSV", [840, 740], buildExportCsvCode),
  telegramSendDocumentNode(
    "Send Export Document",
    [1060, 740],
    "={{ $json.chatId }}"
  ),

  // ---- Feature commands: categories ----
  fsQueryNode("Query Categories (List)", [620, 860], queryCategoriesJson, paramsUserIdAndSystem),
  codeNode("Build Categories Reply", [840, 860], buildCategoriesReplyCode),

  // ---- Feature commands: household hub + dispatch ----
  fsQueryNode("Query Household (Hub)", [620, -420], queryHouseholdJson, paramsUserId),
  {
    id: uid(),
    name: "Dispatch After Household",
    type: "n8n-nodes-base.switch",
    typeVersion: 3.2,
    position: [840, -420],
    parameters: {
      rules: {
        values: ["budget_set", "budgets_list", "goal_new", "contribute", "goals_list", "recurring_new", "recurrings_list", "loan_new", "loans_list", "members", "investments"].map((it, idx) => ({
          conditions: {
            options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
            conditions: [condEquals("={{ $('Classify Update').first().json.intent }}", it, "dispatch-" + idx)],
            combinator: "and",
          },
          renameOutput: true,
          outputKey: it,
        })),
      },
      options: {},
    },
  },

  // budget set
  fsQueryNode("Query Month Budgets (Set)", [1060, -560], queryBudgetsJson, paramsClassifyMonth),
  codeNode("Build Budget Set", [1280, -560], buildBudgetSetCode),
  telegramSendNode(
    "Reply Budget Set",
    [1720, -560],
    "={{ $('Build Budget Set').first().json.chatId }}",
    "={{ $('Build Budget Set').first().json.replyText }}"
  ),

  // budgets list
  fsQueryNode("Query Budgets (List)", [1060, -440], queryBudgetsJson, paramsClassifyMonth),
  codeNode("Collect Budgets (List)", [1280, -440], collectBudgetsListCode),
  fsQueryNode("Query Month Tx (Budgets List)", [1500, -440], queryUserTransactionsJson, paramsUserId),
  codeNode("Build Budgets Reply", [1720, -440], buildBudgetsReplyCode),

  // goal new
  codeNode("Build Goal", [1060, -320], buildGoalCode),
  telegramSendNode(
    "Reply Goal",
    [1720, -320],
    "={{ $('Build Goal').first().json.chatId }}",
    "={{ $('Build Goal').first().json.replyText }}"
  ),

  // contribute + goals list (shared goals query, guarded branches)
  codeNode("Prep Goals Query", [1060, -200], prepScopedQueryCode),
  fsQueryNode("Query Goals", [1280, -200], scopedQueryJson("goals"), paramsScoped),
  codeNode("Build Contribute", [1500, -240], buildContributeCode),
  ifTrueNode("Goal Found?", [1720, -240], "cond-goal-found", "={{ $json.found }}"),
  telegramSendNode(
    "Reply Goal Not Found",
    [1940, -160],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),
  telegramSendNode(
    "Reply Contribute",
    [1940, -240],
    "={{ $('Build Contribute').first().json.chatId }}",
    "={{ $('Build Contribute').first().json.replyText }}"
  ),
  codeNode("Build Goals Reply", [1500, -120], buildGoalsReplyCode),

  // recurring new
  codeNode("Build Recurring", [1060, -20], buildRecurringNewCode),
  telegramSendNode(
    "Reply Recurring",
    [1720, -20],
    "={{ $('Build Recurring').first().json.chatId }}",
    "={{ $('Build Recurring').first().json.replyText }}"
  ),

  // recurrings list
  codeNode("Prep Recurrings Query", [1060, 100], prepScopedQueryCode),
  fsQueryNode("Query Recurring Rules", [1280, 100], scopedQueryJson("recurring_rules"), paramsScoped),
  codeNode("Build Recurrings Reply", [1500, 100], buildRecurringsReplyCode),

  // loan new
  codeNode("Build Loan", [1060, 220], buildLoanCode),
  telegramSendNode(
    "Reply Loan",
    [1720, 220],
    "={{ $('Build Loan').first().json.chatId }}",
    "={{ $('Build Loan').first().json.replyText }}"
  ),

  // loans list
  codeNode("Prep Loans Query", [1060, 340], prepScopedQueryCode),
  fsQueryNode("Query Loans", [1280, 340], scopedQueryJson("loans"), paramsScoped),
  codeNode("Build Loans Reply", [1500, 340], buildLoansReplyCode),

  // members
  codeNode("Prep Members Query", [1060, 460], prepScopedQueryCode),
  fsQueryNode("Query Members", [1280, 460], scopedQueryJson("household_members"), paramsScoped),
  codeNode("Build Members Reply", [1500, 460], buildMembersReplyCode),

  // investments
  codeNode("Prep Investments Query", [1060, 580], prepScopedQueryCode),
  fsQueryNode("Query Investment Accounts", [1280, 580], scopedQueryJson("investment_accounts"), paramsScoped),
  codeNode("Build Investments Reply", [1500, 580], buildInvestmentsReplyCode),

  // per-branch generic writers (dedicated nodes so exactly one reply fires)
  fsBatchWriteNode("Write Budget", [1500, -560]),
  fsBatchWriteNode("Write Contribution", [1940, -240]),
  fsBatchWriteNode("Write Loan", [1500, 220]),
  fsBatchWriteNode("Write Recurring Batch", [1280, 1060]),
  fsGenericCreateNode("Create Goal", [1280, -320]),
  fsGenericCreateNode("Create Recurring Rule", [1280, -20]),
  telegramSendNode(
    "Send List Reply",
    [2200, 460],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),

  // ---- Daily recurring processor (Schedule Trigger) ----
  {
    id: uid(),
    name: "Daily 9AM",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [620, 1060],
    parameters: {
      rule: {
        interval: [
          {
            field: "days",
            triggerAtHour: 9,
          },
        ],
      },
    },
  },
  fsQueryNode("Query Due Recurring Rules", [840, 1060], queryActiveRecurringJson, "={{ [] }}"),
  codeNode("Process Recurring", [1060, 1060], processRecurringCode),

  // ---- Help / fallback branch ----
  telegramSendNode(
    "Send Help",
    [620, 980],
    "={{ $json.chatId }}",
    "={{ $json.replyText }}"
  ),
];

// ---------- connections ----------

function conn(nodeName) {
  return { node: nodeName, type: "main", index: 0 };
}

const connections = {
  "Telegram Trigger": { main: [[conn("Classify Update")]] },
  "Classify Update": { main: [[conn("Route by Intent")]] },

  "Route by Intent": {
    main: [
      [conn("Query Categories")],                                    // 0 Expense Text
      [conn("Get Telegram Photo")],                              // 1 Receipt Photo
      [conn("Query Household (Income)")],                            // 2 Income
      [conn("Query Month Transactions (Summary)")],                  // 3 Summary
      [conn("Send Help")],                                           // 4 Help
      [conn("Query Invites")],                                       // 5 Join
      [conn("Query My Transactions")],                               // 6 Undo
      [conn("Query My Transactions")],                               // 7 Recent
      [conn("Query Categories (List)")],                             // 8 Categories List
      [conn("Query Household (Hub)")],                               // 9 Budget Set
      [conn("Query Household (Hub)")],                               // 10 Budgets List
      [conn("Query Household (Hub)")],                               // 11 Goal New
      [conn("Query Household (Hub)")],                               // 12 Contribute
      [conn("Query Household (Hub)")],                               // 13 Goals List
      [conn("Query Household (Hub)")],                               // 14 Recurring New
      [conn("Query Household (Hub)")],                               // 15 Recurrings List
      [conn("Query Household (Hub)")],                               // 16 Loan New
      [conn("Query Household (Hub)")],                               // 17 Loans List
      [conn("Query Household (Hub)")],                               // 18 Members
      [conn("Query Household (Hub)")],                               // 19 Investments
      [conn("Query My Transactions")],                               // 20 Export CSV
      [conn("Query My Transactions")],                               // 21 Edit (last entry)
      [conn("Query My Transactions")],                               // 22 Ask (chat with data)
      [conn("Register Bot Menu")],                                   // 23 Setup Menu
      [conn("Build NL Prompt")],                                      // 24 NL Parse
      [conn("Answer Callback")],                                     // 25 Callback (buttons)
      [conn("Send Help")],                                           // 26 Unknown
    ],
  },

  // Feature command chains
  "Query My Transactions": {
    main: [[conn("Build Undo"), conn("Build Recent Reply"), conn("Build Export CSV"), conn("Build Edit"), conn("Build Ask Context")]],
  },
  "Build Undo": { main: [[conn("Delete Last Transaction")]] },
  "Delete Last Transaction": { main: [[conn("Reply Undo")]] },
  "Build Export CSV": { main: [[conn("Send Export Document")]] },
  "Query Categories (List)": { main: [[conn("Build Categories Reply")]] },
  "Query Household (Hub)": { main: [[conn("Dispatch After Household")]] },

  "Dispatch After Household": {
    main: [
      [conn("Query Month Budgets (Set)")],   // budget_set
      [conn("Query Budgets (List)")],        // budgets_list
      [conn("Build Goal")],                  // goal_new
      [conn("Prep Goals Query")],            // contribute
      [conn("Prep Goals Query")],            // goals_list
      [conn("Build Recurring")],             // recurring_new
      [conn("Prep Recurrings Query")],      // recurrings_list
      [conn("Build Loan")],                  // loan_new
      [conn("Prep Loans Query")],            // loans_list
      [conn("Prep Members Query")],          // members
      [conn("Prep Investments Query")],      // investments
    ],
  },

  "Query Month Budgets (Set)": { main: [[conn("Build Budget Set")]] },
  "Build Budget Set": { main: [[conn("Write Budget")]] },
  "Write Budget": { main: [[conn("Reply Budget Set")]] },

  "Query Budgets (List)": { main: [[conn("Collect Budgets (List)")]] },
  "Collect Budgets (List)": { main: [[conn("Query Month Tx (Budgets List)")]] },
  "Query Month Tx (Budgets List)": { main: [[conn("Build Budgets Reply")]] },

  "Build Goal": { main: [[conn("Create Goal")]] },
  "Create Goal": { main: [[conn("Reply Goal")]] },

  "Prep Goals Query": { main: [[conn("Query Goals")]] },
  "Query Goals": { main: [[conn("Build Contribute"), conn("Build Goals Reply")]] },
  "Build Contribute": { main: [[conn("Goal Found?")]] },
  "Goal Found?": {
    main: [
      [conn("Write Contribution")], // true
      [conn("Reply Goal Not Found")], // false
    ],
  },
  "Write Contribution": { main: [[conn("Reply Contribute")]] },

  "Build Recurring": { main: [[conn("Create Recurring Rule")]] },
  "Create Recurring Rule": { main: [[conn("Reply Recurring")]] },

  "Prep Recurrings Query": { main: [[conn("Query Recurring Rules")]] },
  "Query Recurring Rules": { main: [[conn("Build Recurrings Reply")]] },

  "Build Loan": { main: [[conn("Write Loan")]] },
  "Write Loan": { main: [[conn("Reply Loan")]] },

  "Prep Loans Query": { main: [[conn("Query Loans")]] },
  "Query Loans": { main: [[conn("Build Loans Reply")]] },

  "Prep Members Query": { main: [[conn("Query Members")]] },
  "Query Members": { main: [[conn("Build Members Reply")]] },

  "Prep Investments Query": { main: [[conn("Query Investment Accounts")]] },
  "Query Investment Accounts": { main: [[conn("Build Investments Reply")]] },

  "Build Categories Reply": { main: [[conn("Send List Reply")]] },
  "Build Recent Reply": { main: [[conn("Send List Reply")]] },
  "Build Budgets Reply": { main: [[conn("Send List Reply")]] },
  "Build Goals Reply": { main: [[conn("Send List Reply")]] },
  "Build Recurrings Reply": { main: [[conn("Send List Reply")]] },
  "Build Loans Reply": { main: [[conn("Send List Reply")]] },
  "Build Members Reply": { main: [[conn("Send List Reply")]] },
  "Build Investments Reply": { main: [[conn("Send List Reply")]] },

  "Daily 9AM": { main: [[conn("Query Due Recurring Rules")]] },
  "Query Due Recurring Rules": { main: [[conn("Process Recurring")]] },
  "Process Recurring": { main: [[conn("Write Recurring Batch")]] },

  "Get Telegram Photo": { main: [[conn("Extract Image")]] },
  "Extract Image": { main: [[conn("Image OK?")]] },
  "Image OK?": {
    main: [
      [conn("Is Album Photo?")], // true - image data present
      [conn("Reply Scan Failed")], // false - no image delivered
    ],
  },
  "Is Album Photo?": {
    main: [
      [conn("Processing Receipt")], // true - solo photo: show progress message
      [conn("Gemini Scan")], // false - album photo: skip progress spam
    ],
  },
  "Processing Receipt": { main: [[conn("Gemini Scan")]] },
  "Gemini Scan": { main: [[conn("Parse Scan")]] },
  "Parse Scan": { main: [[conn("Scan OK?")]] },
  "Scan OK?": {
    main: [
      [conn("Build Scan Confirmation")], // true - park scan, ask Save/Discard
      [conn("Gemini Scan Fallback")], // false - retry once with the next-gen model
    ],
  },
  "Gemini Scan Fallback": { main: [[conn("Parse Scan Fallback")]] },
  "Parse Scan Fallback": { main: [[conn("Scan OK Fallback?")]] },
  "Scan OK Fallback?": {
    main: [
      [conn("Build Scan Confirmation")], // true - park scan, ask Save/Discard
      [conn("Reply Scan Failed")], // false
    ],
  },
  "Build Scan Confirmation": { main: [[conn("Send Scan Confirmation")]] },

  // Callback (button press) flow
  "Answer Callback": { main: [[conn("Read Callback")]] },
  "Read Callback": { main: [[conn("Is Save?")]] },
  "Is Save?": {
    main: [
      [conn("Query Categories")], // true - run the standard expense pipeline
      [conn("Reply Callback Result")], // false - discarded/stale
    ],
  },

  // Natural-language flow
  "Build NL Prompt": { main: [[conn("Gemini NL Parse")]] },
  "Gemini NL Parse": { main: [[conn("Parse NL")]] },
  "Parse NL": { main: [[conn("NL Expense?")]] },
  "NL Expense?": {
    main: [
      [conn("Query Categories")], // true - expense parsed
      [conn("Send List Reply")], // false - hint/answer text
    ],
  },

  // /edit flow
  "Build Edit": { main: [[conn("Write Edit")]] },
  "Write Edit": { main: [[conn("Reply Edit")]] },

  // /ask flow
  "Build Ask Context": { main: [[conn("Gemini Ask")]] },
  "Gemini Ask": { main: [[conn("Build Ask Reply")]] },
  "Build Ask Reply": { main: [[conn("Send List Reply")]] },

  // /setup-menu flow
  "Register Bot Menu": { main: [[conn("Reply Menu")]] },

  "Query Categories": { main: [[conn("Collect Categories")]] },
  "Collect Categories": { main: [[conn("Query Household")]] },
  "Query Household": { main: [[conn("Build Transaction")]] },
  "Build Transaction": { main: [[conn("Create Transaction")]] },
  "Create Transaction": { main: [[conn("Build Budget Query")]] },
  "Build Budget Query": { main: [[conn("Query Budgets")]] },
  "Query Budgets": { main: [[conn("Collect Budgets")]] },
  "Collect Budgets": { main: [[conn("Query Month Transactions (Budget)")]] },
  "Query Month Transactions (Budget)": { main: [[conn("Budget Check & Reply")]] },
  "Budget Check & Reply": { main: [[conn("Send Expense Reply")]] },

  "Query Household (Income)": { main: [[conn("Build Income Entry")]] },
  "Build Income Entry": { main: [[conn("Create Income Entry")]] },
  "Create Income Entry": { main: [[conn("Reply Income")]] },

  "Query Month Transactions (Summary)": { main: [[conn("Collect Summary Tx")]] },
  "Collect Summary Tx": { main: [[conn("Query Month Incomes")]] },
  "Query Month Incomes": { main: [[conn("Build Summary Reply")]] },
  "Build Summary Reply": { main: [[conn("Send Summary Reply")]] },

  "Query Invites": { main: [[conn("Validate Invite")]] },
  "Validate Invite": { main: [[conn("Invite Valid?")]] },
  "Invite Valid?": {
    main: [
      [conn("Create or Update Membership")], // true
      [conn("Reply Join Failed")], // false
    ],
  },
  "Create or Update Membership": { main: [[conn("Mark Invite Accepted")]] },
  "Mark Invite Accepted": { main: [[conn("Reply Join Success")]] },
};

const workflow = {
  name: "Expense Planner Bot",
  nodes,
  connections,
  settings: { executionOrder: "v1" },
  pinData: {},
};

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: node gen-workflow.cjs <output-path>");
  process.exit(1);
}
fs.mkdirSync(require("path").dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
console.log("Wrote " + outPath + " with " + nodes.length + " nodes");

















