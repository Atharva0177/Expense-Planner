# Expense Planner Telegram Bot (n8n)

The Telegram bot for Expense Planner is implemented as an [n8n](https://n8n.io)
workflow (`expense-planner-bot.json`). It replaces the earlier Telegram webhook
implementations that were duplicated across the Express server, Cloudflare
Pages Functions, and Cloudflare Workers.

## What the bot does

| Command | Action |
| --- | --- |
| `/spent <amount> <category> [note]` | Log an expense (also `/spend`, `/paid`, `/bought`, `/purchase`) |
| *(plain text)* | **Natural-language logging**: "spent 250 on groceries yesterday" → AI parses → logs it |
| `/earned <amount> [note]` | Log an income entry for the current month (also `/received`, `/got`, `/income`, `/salary`) |
| *(send a receipt photo)* | Gemini extracts the details, then replies with **✅ Save / ❌ Discard inline buttons** — nothing is written until you confirm |
| *(send several photos as an album)* | **Multi-receipt batches**: every photo is scanned; only one progress message instead of one per photo |
| `/undo` | Delete your most recent entry |
| `/edit <amount\|note\|category\|date> <value>` | Edit your most recent entry (e.g. `/edit amount 500`) |
| `/ask <question>` | **Chat with your data**: "how much did I spend on medical this year?" — answered from your logged transactions |
| `/summary` or `/summary YYYY-MM` | Spend + income + savings-rate breakdown for a month |
| `/recent` | Your last 10 entries |
| `/budgets` | Budget vs spend for the current month |
| `/goals` | Savings goals with progress |
| `/loans` | Loans with EMI, rate, tenure |
| `/recurrings` | Recurring rules with next-due dates |
| `/investments` | Investment accounts (read-only) |
| `/members` | Household member list |
| `/categories` | Valid category names |
| `/export` | CSV of this month's entries (sent as a Telegram document) |
| `/budget <category> <amount>` | Set/update a monthly budget (household-visible on the website) |
| `/goal <name> <amount> [YYYY-MM-DD]` | Create a savings goal |
| `/contribute <goal name> <amount>` | Add money to a goal |
| `/recurring <amount> <monthly\|quarterly\|yearly> <category> [label]` | Create a recurring rule |
| `/loan <principal> <rate%> <months> [label]` | Create a loan with full amortization schedule + monthly EMI rule |
| `/join <invite code>` | Link this Telegram account to your web-app household (one-time) |
| `/setup-menu` | Registers the **native Telegram command menu** (the `/` button lists all commands) — run once after import |
| `/tax` | Info pointing to the website's tax planner |
| `/help`, `/start` | Command help |

**Bonus over the website:** a daily 9 AM schedule trigger processes due
recurring rules automatically (the website only processes them when you open
the Recurring tab).

Extras: budget warnings on every expense reply (household-wide when linked),
category suggestions for near-miss names, stale-receipt date guarding,
deterministic extraction (temperature 0) with model fallback, HTML-escaped
replies, CSV formula-injection guard.

**Not bot-suitable (by design):** the interactive tax planner, PDF/Excel
report generation, investment holdings/valuations entry, CSV import, and
(deep) transaction editing remain website-only — `/edit` covers the common
"fix the last entry" case.
| Anything else | Friendly fallback message |

Extras beyond the original bot:

- **Income logging** (the old bot replied "not implemented").
- **Budget warnings**: replies include an over-budget / 80%-used warning when a
  budget exists for that category and month (personal or household-scoped).
- **Category suggestions**: multi-word categories are matched properly
  (`/spent 250 dining out lunch` → category "Dining Out", note "lunch"), and
  unrecognized categories trigger "Did you mean ...?" suggestions.

Data is written to the exact same Firestore collections the web app uses:

- `transactions` with `user_id: "telegram_<tg-user-id>"`, `source: "telegram"`
  (or `"telegram_receipt"` for scanned photos) — identical field shape to the
  web app, so existing dashboards keep working.
- `income_entries` with `month: YYYY-MM`, `other: <amount>`,
  `net_credited: <amount>`.

## Receipt photo pipeline

The Telegram Trigger's "Download Images/Files" option is **off** by design:
n8n's image-size picker (`extraLarge` = index 3) silently falls back to the
**~90px thumbnail** (`photo[0]`) whenever Telegram sends fewer sizes — the
receipt becomes illegible and Gemini hallucinates plausible-looking garbage.
Instead, the workflow downloads the image itself:

```
Photo message → Get Telegram Photo (largest variant, by width×height)
             → Extract Image (validity guard: JPEG/PNG magic bytes, min size)
             → Image OK? → 📸 Processing receipt... → Gemini Scan (2.5-pro, temp 0)
             → (fallback: 2.5-flash) → shared expense pipeline
```

## Receipt scanning quality

Receipt extraction uses a strict, field-by-field prompt (grand total only —
never subtotals/line items/phone numbers; dates read digit-by-digit; category
constrained to the app's actual category list) plus structured-output schema
descriptions, and post-scan sanity guards:

- **Amount**: must be positive and under ₹50,00,000 — obvious misreads are
  rejected instead of being logged as garbage
- **Date**: missing/malformed → today (silent); more than 60 days old or in
  the future → today, and the reply notes the original date (the dashboard is
  month-scoped, so stale dates land in months nobody views)
- **Merchant**: placeholder junk (`STORE NAME`, `N/A`, …) is dropped
- **Model escalation with deterministic extraction**: `temperature: 0` (same
  receipt → same result, no creative invention); primary model
  **`gemini-2.5-pro`** (the strongest free vision model on the AI Studio tier);
  if it fails, one retry with **`gemini-2.5-flash`**. Expect 5–15s per scan —
  pro is slower but far more accurate at reading receipts than flash models.
  Note: `gemini-2.5-pro` has a low free-tier rate limit — rapid tests may hit
  a 429; the bot replies with a "rate limit" reason — wait ~1 minute and resend.

To swap models (e.g. make pro the primary for maximum accuracy), edit the URL
in the `Gemini Scan` / `Gemini Scan Pro` nodes.

## Family members using the bot

The bot is **multi-user safe by design** — every message is attributed to its
sender's own `telegram_<id>` identity, and all personal commands (`/undo`,
`/recent`, `/summary`, `/export`) are isolated per sender. To let another
family member use the bot:

1. Get their Telegram user ID (each person messages
   [@userinfobot](https://t.me/userinfobot))
2. Open `Telegram Trigger` → Additional Fields → **Restrict to User IDs** and
   append it, comma-separated (e.g. `7682242660, 123456789`), then **Publish**
3. That member sends `/join <invite code>` with a fresh code from the website's
   Family tab — their Telegram identity becomes a household member
4. From then on:
   - Their entries flow into the household and appear on the website
   - `/budgets`, `/goals`, `/loans`, `/recurrings`, `/members` show the shared
     household data
   - **Budget warnings count the whole household's spend** in the category
     (marked "household-wide"), matching the website's Budgets tab
   - `/undo` still deletes only *their* last entry, `/summary`/`/recent`
     stay scoped to their own logging

Anyone **not** on the allowlist is silently ignored by the trigger — no reply,
no data access. Don't remove the allowlist to "open" the bot: the workflow
writes to your Firestore with a service account, so access must stay
invite-only.

## Linking the bot to the website (household integration)

Bot entries land in the same Firestore database the website reads, but the
website shows data scoped to your **household**. To make bot entries appear on
the website dashboard, budgets, and reports, link the Telegram account once:

1. On the website → **Family tab** → **Invite Family Member** → create an
   invite (any role) and copy the **invite code**
2. Send the code to the bot: `/join ABC123`
3. The bot writes a `household_members` doc for `user_id:
   "telegram_<your-tg-id>"` with your household's ID (idempotent — sending
   `/join` again with a new code moves it to that household) and marks the
   invite as accepted
4. Every subsequent `/spent`, `/earned`, and receipt scan is stamped with your
   `household_id` — so the entries show up on the website (within the app's
   ~25s cache or on the next tab/month refresh) and the bot's budget warnings
   start matching the budgets you set on the website

Until `/join` is done, bot entries are stored under the synthetic
`telegram_<id>` user and remain invisible to the web dashboard.

## Maintaining the workflow in the repo

The workflow JSON is **generated** — the source of truth is
`n8n/generate-workflow.cjs`:

```bash
npm run bot:generate   # regenerate n8n/expense-planner-bot.json from the generator
npm run bot:validate   # 128-test logic suite + graph/wiring/code/expression validators
```

CI runs both on every push (the `bot-validate` job), plus a drift check that
fails if the committed JSON doesn't match the generator.

**Auto-deploy to n8n:** with `N8N_API_URL` and `N8N_API_KEY` set as repository
secrets, every push to `main` deploys the workflow to your live n8n via its
REST API (`n8n/scripts/deploy-workflow.mjs`) — **preserving credential
assignments and activation state** (credentials are merged by node name from
the live workflow before the update). Without the secrets the job soft-skips.
After the first auto-deploy, run `/setup-menu` once in Telegram to refresh the
command menu.

Hot-fixing without re-import: paste the current `Classify Update` node code
from `n8n/classify-update.js`, or `npm run bot:generate` and re-import.

## Firestore security rules (deploy once)

`firestore.rules` in the repo root contains least-privilege rules (owner or
household-member reads, owner-only writes, default-deny). **They only protect
the database once deployed**:

1. Firebase console → Firestore → select the named database
   (`ai-studio-59a52c44-...`) → **Rules** tab
2. Paste the contents of `firestore.rules` → **Publish**

Notes:

- The **bot is unaffected** — it authenticates with a service account, which
  bypasses rules
- The web app maintains a deterministic membership anchor
  (`household_members/{uid}`) automatically (self-healed in `getHhId`, kept in
  sync on join/leave/create); new invites are stored at `invites/{code}` so
  rules can verify them
- Users who joined households via *legacy* invite docs (pre-migration) need a
  one-time anchor doc or a fresh invite; household creators are covered
  automatically

## Required Firestore composite indexes

Household-scoped queries in the web app filter by `household_id` plus a second
field, which requires composite indexes on the named database
(`ai-studio-59a52c44-...`). Firestore does **not** create these automatically,
and the app's error handler silently falls back to empty lists when they are
missing — so dashboards show nothing (for bot entries *and* manual web entries)
with no visible error. If lists look empty right after linking the bot:

1. Open the website → F12 → Console → refresh
2. Find the red error `The query requires an index` with a long
   console.firebase.google.com link → click it → **Create index** (~1-2 min)
3. Or create them manually in Firebase console → Firestore → Indexes → Add:

| Collection | Field 1 | Field 2 |
| --- | --- | --- |
| `transactions` | `household_id` Ascending | `date` Ascending |
| `income_entries` | `household_id` Ascending | `month` Ascending |
| `budgets` | `household_id` Ascending | `month` Ascending |

## Architecture

```
Telegram ──▶ Telegram Trigger (n8n webhook, auto-registered)
              └─ Classify Update (Code) ─▶ Route by Intent (Switch)
                   ├─ Expense text ──▶ Query Categories ─▶ Query Household
                   │      └─ (receipt photo ─▶ Gemini Scan ─▶ same pipeline)
                   │            └─ Build Tx ─▶ Create Transaction
                   │                 └─ Budget check ─▶ Send Expense Reply
                   ├─ Income ─▶ Create Income Entry ─▶ Reply
                   ├─ /summary ─▶ Query Month Transactions ─▶ Reply
                   └─ /help, unknown ─▶ Send Help
```

All Firestore access uses the native **Google Cloud Firestore** node with a
**service account** (Admin-level access; Firestore security rules don't apply)
and targets the project's named database directly — no code, no webhook
secrets, no manual `setWebhook` scripts. n8n registers and secures the Telegram
webhook automatically (Telegram only allows one webhook per bot, so activating
this workflow cleanly replaces any previously registered worker webhook).

## Setup

### 1. Infrastructure

```bash
cp .env.example .env
# Edit .env: set N8N_ENCRYPTION_KEY, NGROK_AUTHTOKEN, NGROK_DOMAIN, N8N_WEBHOOK_URL

docker compose --profile n8n up -d
```

The `n8n` and `ngrok` services live behind the `n8n` profile so the
default `docker compose up` still runs just the web app.

Public exposure uses **ngrok** with a free permanent static domain:

1. Create a free account at https://dashboard.ngrok.com (GitHub sign-in works)
2. Copy your **authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
3. Claim your free static domain (e.g. `fox-robust-owl.ngrok-free.app`):
   https://dashboard.ngrok.com/domains
4. Put both into `.env` as `NGROK_AUTHTOKEN` / `NGROK_DOMAIN`, and set
   `N8N_WEBHOOK_URL` to `https://<your-static-domain>`.

Use `http://localhost:5678` for the n8n editor UI (ngrok's browser
interstitial page doesn't affect Telegram's server-side webhook POSTs).

> **Alternative — Cloudflare Tunnel:** if you own a registered domain on
> Cloudflare, swap the commented `cloudflared` service into docker-compose.yml
> in place of `ngrok`, create a tunnel in Zero Trust → Networks → Tunnels with
> a public hostname pointed at `http://n8n:5678`, and set
> `N8N_WEBHOOK_URL`/`CLOUDFLARED_TUNNEL_TOKEN` accordingly. Note: `*.workers.dev`
> URLs cannot be used as tunnel hostnames — they are Worker deployment URLs,
> not DNS zones in your account.

> If you already run n8n somewhere else, skip Docker entirely: just import the
> workflow JSON into your instance and make sure `WEBHOOK_URL` is set to its
> public address.

### 2. Create the bot and collect credentials

You need three things:

1. **Telegram bot token** — message [@BotFather](https://t.me/BotFather) →
   `/newbot` (or reuse the existing bot's token).
2. **Gemini API key** — from
   [Google AI Studio](https://aistudio.google.com/app/apikey) (same key the
   receipt scanner uses).
3. **Google service account JSON** for the Firebase project
   `gen-lang-client-0213350901`:
   1. Open the project in [Google Cloud Console](https://console.cloud.google.com/)
      (the Firebase project's GCP project).
   2. Enable the **Cloud Firestore API** (APIs & Services → Library).
   3. IAM & Admin → Service Accounts → Create service account → grant role
      **Cloud Datastore User** (skip the optional steps).
   4. Open the account → Keys → Add key → JSON → download.

### 3. Import and configure the workflow

1. Open n8n at your tunnel URL and create the owner account on first visit.
2. Workflows → Import from File → `n8n/expense-planner-bot.json`.
3. Create credentials (Credentials → Add):
   - **Telegram API**: paste the bot token.
   - **Google Service Account API** (for the Firestore query/upsert nodes):
     paste the service account **email** and **private key** (the full
     `-----BEGIN PRIVATE KEY-----...` block from the JSON, including escaped
     newlines as-is).
   - **Google Service Account API — Firestore REST** (a second copy, for the
     two HTTP writer nodes): same email + private key, **plus set the Scope(s)
     field to `https://www.googleapis.com/auth/datastore`**. Create it from the
     "Create Transaction" node's credential dropdown — the Scope(s) field only
     appears for credentials created in an HTTP Request context.
   - **Header Auth**: name `x-goog-api-key`, value = your Gemini API key.

   > Why the writers use raw REST: the n8n Firestore node auto-converts
   > date-like strings (`"2026-10-08"`) into Firestore **timestamps**. The web
   > app stores and range-queries `date` as a plain **string** — and a type
   > mismatch in Firestore silently returns zero results. The "Create
   > Transaction" / "Create Income Entry" HTTP Request nodes therefore post
   > fully-typed documents (string dates, exactly like the web app writes
   > them). HTTP Request signs its own token from the credential's Scope(s),
   > hence the second credential.

4. Assign them in the workflow:
    - `Telegram Trigger` and all six `*Reply`/`Send`/`Processing` Telegram
      nodes → **Telegram API** credential.
    - The Firestore **query/upsert** nodes (Query Categories, Query Household ×2,
      Query Budgets, Query Month Transactions ×2, Query Invites, Create or
      Update Membership, Mark Invite Accepted) → the **Google Service Account
      API** credential. Authentication must show **Service Account**.
    - `Create Transaction` and `Create Income Entry` (HTTP Request) → the
      **Firestore REST** service-account credential (Authentication:
      Predefined Credential Type → Google API).
    - `Gemini Scan` (HTTP Request) → **Header Auth** credential
      (Authentication: Generic Credential Type → Header Auth).
5. **Security (mostly pre-configured)**: the imported workflow already ships
   with a **Restrict to User IDs** allowlist on the Telegram Trigger (only the
   owner's Telegram account can invoke the bot). If you forked this project,
   replace the ID with your own (get it from
   [@userinfobot](https://t.me/userinfobot)) — without the allowlist, anyone
   who finds the bot can write to your database.
6. Save and **Activate** the workflow — n8n registers the webhook with
   Telegram automatically.

### 4. Test

In a chat with your bot:

```
/help                     → command list
/spent 250 groceries      → ✅ Expense Logged (check the transactions collection)
/spent 400 dining out lunch with friends → category "Dining Out", note "lunch with friends"
/earned 50000 salary      → ✅ Income Logged (income_entries)
/summary                  → 📊 month breakdown
send a receipt photo       → 📸 Processing... → ✅ Receipt Scanned & Logged
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Bot never replies | Check n8n Executions for errors; verify `WEBHOOK_URL` is reachable from the internet (`curl -I https://n8n.your-domain.com/healthz`) |
| `Provided secret is not valid` in n8n logs | An old n8n process registered a different secret — deactivate and reactivate the workflow (re-registers the webhook) |
| Public URL unreachable | `curl -I https://<NGROK_DOMAIN>` must respond; check the ngrok container logs (`docker compose logs -f ngrok`) and confirm the static domain is claimed |
| `Bot doesn't respond, old worker responds` | Deactivate/reactivate the workflow; n8n's `setWebhook` replaces the old URL. If needed, `curl https://api.telegram.org/bot<TOKEN>/deleteWebhook` first |
| Firestore nodes: 403/permission errors | Service account missing **Cloud Datastore User** role, or Firestore API not enabled |
| Firestore nodes: database not found | The nodes are preconfigured for database ID `ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5`; change the **Database** field if you use a different Firebase project |
| Receipt scans start failing | The `Gemini Scan` node uses `gemini-2.5-flash` and retries 3× automatically; if the model name is ever retired, edit the URL in the node (e.g. swap to another model) — no other changes needed |
| Duplicate messages | Only one workflow with a Telegram trigger may be active per bot token; deactivate stale copies (check the Executions tab) |

## Notes

- **No composite indexes required** — all Firestore queries use single-field
  filters; month filtering happens in Code nodes.
- **Synthetic users**: Telegram senders are stored as `user_id:
  "telegram_<id>"`. To surface a Telegram user's data inside a web-app
  household, add a `household_members` doc for that ID (advanced; the web app
  does not do this automatically).
- Workflow modifications (new commands, reply formats) are made in the n8n
  editor; re-export to `expense-planner-bot.json` to keep the repo in sync.
