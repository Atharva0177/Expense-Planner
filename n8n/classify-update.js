// Classify Update node - current code (mirrors the Classify Update node in expense-planner-bot.json).
// Paste into the n8n Code node named "Classify Update" when hot-fixing without re-importing the whole workflow.

// Normalize the incoming Telegram update into a single routing payload.
const update = items[0].json;
const msg = update.message || update.edited_message;
if (!msg || !msg.from || !msg.chat) return [];

const chatId = msg.chat.id;
const tgUserId = msg.from.id;
const userId = 'telegram_' + tgUserId;
// Strip invisible Unicode chars (zero-width spaces, directional marks) that
// copy-paste can inject alongside invite codes - they silently break regex anchors.
const text = (msg.text || msg.caption || '').replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '').trim();
// Photo/document detection from the raw update (the trigger's own download
// is DISABLED: its imageSize picker silently falls back to the ~90px thumbnail
// when Telegram sends fewer sizes, which makes receipts illegible).
const photoSizes = Array.isArray(msg.photo) ? msg.photo : [];
const imgDoc = (msg.document && String(msg.document.mime_type || '').startsWith('image/')) ? msg.document : null;
let photoFileId = '';
if (photoSizes.length > 0) {
  const largest = photoSizes.reduce((a, b) => ((b.width || 0) * (b.height || 0) > (a.width || 0) * (a.height || 0) ? b : a));
  photoFileId = String(largest.file_id || '');
} else if (imgDoc) {
  photoFileId = String(imgDoc.file_id || '');
}

const today = new Date().toISOString().split('T')[0];
const month = today.slice(0, 7);
const monthStart = month + '-01';
const parts = month.split('-').map(Number);
const monthEnd = month + '-' + String(new Date(Date.UTC(parts[0], parts[1], 0)).getUTCDate()).padStart(2, '0');

const HELP_TEXT = '\u{1F916} <b>Expense Planner Bot</b>\n\n<b>Log</b>\n/spent 250 groceries [note] \u2014 log an expense\n\u{1F4F8} send a receipt photo \u2014 AI auto-logs it\n/earned 50000 [note] \u2014 log income\n/undo \u2014 delete my last entry\n\n<b>View</b>\n/summary [YYYY-MM] \u2014 spend + income breakdown\n/recent \u2014 my last 10 entries\n/budgets \u2014 budget vs spend this month\n/goals \u2014 savings goals with progress\n/loans \u2014 loans and EMI info\n/recurrings \u2014 recurring rules\n/investments \u2014 investment accounts\n/members \u2014 household members\n/categories \u2014 valid category names\n/export \u2014 CSV of this month\n\n<b>Manage</b>\n/budget dining out 2000 \u2014 set monthly budget\n/goal laptop 80000 2027-06-01 \u2014 new savings goal\n/contribute laptop 5000 \u2014 add to a goal\n/recurring 1500 monthly groceries \u2014 new recurring rule\n/loan 500000 9.5 60 home \u2014 new loan with schedule\n/join [invite code] \u2014 link to your household (code from the website Family tab)\n/tax \u2014 tax planner info\n/help \u2014 this message';
const FALLBACK_TEXT = '\u{1F914} Unrecognized command. Send /help to see everything I can do.';
const TAX_HINT = '\u{1F4DA} The tax planner (old vs new regime, HRA, 80C/80D, advance tax) needs many inputs and works best on the website: open the Taxes tab there. Bot commands cover everything else \u2014 /help for the list.';

const EXPENSE = /^\/(?:spent|spend|paid|bought|purchase)\s+(\d+(?:\.\d+)?)\s+(.+)$/i;
const INCOME = /^\/(?:received|got|earned|income|salary)\s+(\d+(?:\.\d+)?)\s*(.*)$/i;
const SUMMARY = /^\/summary(?:\s+(\d{4}-(?:0[1-9]|1[0-2])))?$/i;
const UNDO = /^\/undo$/i;
const RECENT = /^\/(?:recent|list)$/i;
const CATEGORIES = /^\/(?:categories|cats)$/i;
const BUDGETS_LIST = /^\/budgets$/i;
const BUDGET_SET = /^\/budget\s+(.+?)\s+(\d+(?:\.\d+)?)\s*$/i;
const GOALS_LIST = /^\/goals$/i;
const GOAL_NEW = /^\/goal\s+(.+)$/i;
const CONTRIBUTE = /^\/(?:contribute|save)\s+(.+)$/i;
const RECURRINGS_LIST = /^\/(?:recurrings|rules)$/i;
const RECURRING_NEW = /^\/(?:recurring|rule)\s+(\d+(?:\.\d+)?)\s+(monthly|quarterly|yearly)\s+(\S+)(?:\s+(.*))?$/i;
const LOANS_LIST = /^\/loans$/i;
const LOAN_NEW = /^\/loan\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+)(?:\s+(.*))?$/i;
const MEMBERS = /^\/(?:members|family)$/i;
const INVESTMENTS = /^\/(?:investments|inv)$/i;
const EXPORT = /^\/(?:export|csv)$/i;
const TAX = /^\/tax$/i;
const JOIN = /^\/join(?:@\w+)?\s+([A-Za-z0-9]{3,20})/i;
const HELP = /^\/(help|start)$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const out = {
  chatId, tgUserId, userId, today, month, monthStart, monthEnd,
  tgUsername: msg.from.username || '',
  intent: 'unknown', replyText: FALLBACK_TEXT,
};

const e = text.match(EXPENSE);
if (e) {
  const amount = parseFloat(e[1]);
  const rest = e[2].trim();
  const rm = rest.match(/^(\S+)(?:\s+(.*))?$/);
  out.intent = 'expense_text';
  out.amount = amount;
  out.rawCategory = rm ? rm[1] : rest;
  out.note = rm && rm[2] ? rm[2] : '';
  out.date = today;
  return [{ json: out, binary: items[0].binary }];
}

const i = text.match(INCOME);
if (i) {
  out.intent = 'income_text';
  out.amount = parseFloat(i[1]);
  out.note = (i[2] || '').trim() || 'Income';
  return [{ json: out, binary: items[0].binary }];
}

const s = text.match(SUMMARY);
if (s) {
  out.intent = 'summary';
  if (s[1]) {
    const mp = s[1].split('-').map(Number);
    out.month = s[1];
    out.monthStart = s[1] + '-01';
    out.monthEnd = s[1] + '-' + String(new Date(Date.UTC(mp[0], mp[1], 0)).getUTCDate()).padStart(2, '0');
  }
  return [{ json: out, binary: items[0].binary }];
}

const j = text.match(JOIN);
if (j) {
  out.intent = 'join';
  out.inviteCode = j[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (out.inviteCode) return [{ json: out, binary: items[0].binary }];
}

// ---- Feature commands ----
if (UNDO.test(text)) { out.intent = 'undo'; return [{ json: out, binary: items[0].binary }]; }
if (RECENT.test(text)) { out.intent = 'recent'; return [{ json: out, binary: items[0].binary }]; }
if (CATEGORIES.test(text)) { out.intent = 'categories_list'; return [{ json: out, binary: items[0].binary }]; }
if (BUDGETS_LIST.test(text)) { out.intent = 'budgets_list'; return [{ json: out, binary: items[0].binary }]; }
if (GOALS_LIST.test(text)) { out.intent = 'goals_list'; return [{ json: out, binary: items[0].binary }]; }
if (RECURRINGS_LIST.test(text)) { out.intent = 'recurrings_list'; return [{ json: out, binary: items[0].binary }]; }
if (LOANS_LIST.test(text)) { out.intent = 'loans_list'; return [{ json: out, binary: items[0].binary }]; }
if (MEMBERS.test(text)) { out.intent = 'members'; return [{ json: out, binary: items[0].binary }]; }
if (INVESTMENTS.test(text)) { out.intent = 'investments'; return [{ json: out, binary: items[0].binary }]; }
if (EXPORT.test(text)) { out.intent = 'export_csv'; return [{ json: out, binary: items[0].binary }]; }
if (TAX.test(text)) { out.intent = 'help'; out.replyText = TAX_HINT; return [{ json: out, binary: items[0].binary }]; }

const b = text.match(BUDGET_SET);
if (b) {
  out.intent = 'budget_set';
  out.budgetCategory = b[1].trim();
  out.budgetAmount = parseFloat(b[2]);
  return [{ json: out, binary: items[0].binary }];
}

const g = text.match(GOAL_NEW);
if (g) {
  const tokens = g[1].trim().split(/\s+/);
  let targetDate = '';
  if (tokens.length >= 3 && DATE_RE.test(tokens[tokens.length - 1])) targetDate = tokens.pop();
  const amount = parseFloat(tokens[tokens.length - 1]);
  if (!isNaN(amount) && tokens.length >= 2) {
    tokens.pop();
    out.intent = 'goal_new';
    out.goalName = tokens.join(' ');
    out.goalAmount = amount;
    out.goalDate = targetDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    return [{ json: out, binary: items[0].binary }];
  }
  out.intent = 'help';
  out.replyText = 'Usage: /goal [name] [amount] [YYYY-MM-DD]\nExample: /goal laptop 80000 2027-06-01';
  return [{ json: out, binary: items[0].binary }];
}

const ct = text.match(CONTRIBUTE);
if (ct) {
  const tokens = ct[1].trim().split(/\s+/);
  const amount = parseFloat(tokens[tokens.length - 1]);
  if (!isNaN(amount) && tokens.length >= 2) {
    tokens.pop();
    out.intent = 'contribute';
    out.goalMatch = tokens.join(' ');
    out.goalAmount = amount;
    return [{ json: out, binary: items[0].binary }];
  }
  out.intent = 'help';
  out.replyText = 'Usage: /contribute [goal name] [amount]\nExample: /contribute laptop 5000';
  return [{ json: out, binary: items[0].binary }];
}

const rr = text.match(RECURRING_NEW);
if (rr) {
  out.intent = 'recurring_new';
  out.recAmount = parseFloat(rr[1]);
  out.recFreq = rr[2].toLowerCase();
  out.recCategory = rr[3];
  out.recLabel = (rr[4] || '').trim();
  return [{ json: out, binary: items[0].binary }];
}

const ln = text.match(LOAN_NEW);
if (ln) {
  out.intent = 'loan_new';
  out.loanPrincipal = parseFloat(ln[1]);
  out.loanRate = parseFloat(ln[2]);
  out.loanMonths = parseInt(ln[3], 10);
  out.loanLabel = (ln[4] || 'Loan').trim();
  return [{ json: out, binary: items[0].binary }];
}

if (HELP.test(text)) {
  out.intent = 'help';
  out.replyText = HELP_TEXT;
  return [{ json: out, binary: items[0].binary }];
}

if (photoFileId) {
  out.intent = 'photo';
  out.photoFileId = photoFileId;
  return [{ json: out, binary: items[0].binary }];
}

// Unrecognized slash-command: echo the raw text (escaped) so invisible
// characters and formatting become visible for debugging.
if (text.startsWith('/')) {
  out.replyText = FALLBACK_TEXT + '\n\n(received: ' + JSON.stringify(text) + ')';
}
return [{ json: out, binary: items[0].binary }];