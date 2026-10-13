# Free 24/7 hosting WITHOUT a credit card (Render free tier + Neon)

Oracle/GCP/AWS free tiers require a credit card at signup, and Hugging Face
Docker Spaces are now paid. This setup needs only a **GitHub login** and is
$0 forever:

| Piece | What it provides | Signup needs |
|---|---|---|
| Render (free web service, Docker runtime) | Runs the n8n container 24/7, public HTTPS `*.onrender.com` | GitHub login |
| Neon Postgres (free plan) | n8n's database (workflows, credentials, executions, static data) — survives restarts | Email/GitHub login |
| cron-job.org or UptimeRobot (free) | Pings the service so it never sleeps | Email login |

```
Telegram --HTTPS--> expense-planner-n8n.onrender.com (Render proxy, trusted cert)
                        -> n8n container (listens on 7860; Render auto-detects)
                             -> Neon Postgres (all persistent data)
                             -> Firestore REST / Gemini as before
Pinger --GET /healthz every 10 min--> keeps the service awake
```

**Honest caveats before you start**

- Render's free instances have **512 MB RAM**. The Dockerfile caps task-runner
  concurrency at one (`N8N_RUNNERS_MAX_CONCURRENCY=1`) to bound memory — the
  bot runs fine; the n8n **editor UI can feel sluggish** when you open it.
- Free services **sleep after 15 minutes without inbound traffic** — the
  pinger (Step 5) is MANDATORY here, not optional.
- If the pinger ever lapses, the next request pays a **~60–90 s cold boot**
  (container start + Neon wake). Telegram queues and retries webhook
  deliveries, so messages usually still arrive.
- Neon **suspends after ~5 min idle** and auto-resumes on the next query —
  the first message after a quiet period can take a few seconds longer.
- Render free instances have **ephemeral disks** — that is exactly why the
  database is external: every restart/deploy boots n8n with everything intact.
- Free-plan details are as of writing — confirm the plan shows **$0** during
  creation and that no card is requested (the Free plan never should be).

## Step 1 — Neon Postgres (5 minutes)

1. Sign up at `neon.com` → create a project, region **Singapore**
   (closest to India), default branch `main`.
2. Copy the **connection string**:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-odd-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   Keep it open — you'll paste the parts in Step 2. n8n creates its tables
   automatically on first boot; the free 0.5 GB is plenty with the pruning
   defaults in `render.yaml` (72 h / 1000 executions).

## Step 2 — Deploy to Render (10 minutes)

1. Sign up at `dashboard.render.com` with your **GitHub** account.
2. **New → Blueprint** → select this repo. Render reads `render.yaml`
   (repo root) and proposes one free web service: `expense-planner-n8n`.
3. It prompts for the `sync: false` values — fill from your notes:

| Prompt | Paste |
|---|---|
| `N8N_ENCRYPTION_KEY` | `openssl rand -base64 32` output (locally: any Git Bash/WSL). **Save it** — reusing it keeps credentials decryptable across future re-deploys |
| `TELEGRAM_BOT_TOKEN` | your bot token from @BotFather |
| `DB_POSTGRESDB_HOST` | `ep-odd-name-123456.ap-southeast-1.aws.neon.tech` |
| `DB_POSTGRESDB_DATABASE` | `neondb` |
| `DB_POSTGRESDB_USER` | `neondb_owner` |
| `DB_POSTGRESDB_PASSWORD` | the password from the string |

The `N8N_HOST` / `N8N_WEBHOOK_URL` values are applied automatically — they
are constants of the service URL baked into `render.yaml`.

4. **Apply** and wait for the build (~5 min). The public URL is
   `https://expense-planner-n8n.onrender.com` — check **Events/Logs** until
   n8n reports it's listening.

## Step 3 — First-run setup (10 minutes)

1. Open `https://expense-planner-n8n.onrender.com` → create the n8n
   **owner account** (strong password — the login page is public) → enable
   2FA in Settings.
2. Import `n8n/expense-planner-bot.json`.
3. Assign the three credentials exactly as in n8n/README.md → Setup
   (Telegram API, Google Service Account API, Header Auth for Gemini).
   They persist in Neon — restarts and re-deploys do not lose them.
4. **Publish** the workflow → send `/setup-menu` in Telegram → test `/help`.

If you use the CI auto-deploy, update the GitHub secrets:
`N8N_API_URL=https://expense-planner-n8n.onrender.com` and a fresh
`N8N_API_KEY` from this instance.

## Step 4 — Keep it awake (2 minutes, mandatory)

Free services sleep after **15 minutes** without traffic. Sign up at
`cron-job.org` (or UptimeRobot) → create a job hitting

```
https://expense-planner-n8n.onrender.com/healthz
```

every **10 minutes**. `/healthz` is n8n's public health endpoint; a 200
response resets the sleep timer, and the daily 9 AM recurring processor
always finds the bot awake.

## Step 5 — Cut over from your PC

Telegram allows only ONE webhook per bot token — activating the workflow in
Step 3 re-registered it to Render. Now stop the local instance:

```bash
# on your PC:
docker compose --profile n8n down
```

## Updating the bot later

Render's `autoDeploy` is off (pushes to `main` are usually website changes).
After changing `n8n/expense-planner-bot.json`, deploy manually:
Render dashboard → the service → **Manual Deploy → Deploy latest commit**
(or re-import the JSON in n8n's editor, as before).

## Troubleshooting

- **Build fails** → Render → Events: usually a typo in a `DB_POSTGRESDB_*`
  value; the build itself needs no secrets.
- **Boot loop / "connection is insecure (try using `sslmode=require`)"** →
  n8n 2.x renamed the SSL toggle to **`DB_POSTGRESDB_SSL_ENABLED`** (older
  guides say `DB_POSTGRESDB_SSL`, which is silently ignored — that's what
  this error means). It's already set correctly in `render.yaml`.
- **"Postgres X is not supported" warnings** → informational for Neon
  (managed Postgres 17); the bot works regardless.
- **"Task runner connection attempt failed: invalid or expired grant token"
  (403 against the task broker)** → the JS runner booted slower than the
  default 30-second grant token on the free tier. The Dockerfile sets
  `N8N_RUNNERS_GRANT_TOKEN_TTL=300`; the runner registers itself on retry
  (look for `Registered runner "JS Task Runner"`). If it never registers,
  redeploy once after Neon is warm.
- **"Failed to start Python task runner... Python 3 is missing"** → harmless;
  this bot only uses JavaScript Code nodes.
- **"New primary port detected: 7860. Restarting deploy"** → one-time Render
  proxy wiring after the first boot, not an error.
- **First message after idle is slow / one failure** → Neon waking; it
  auto-resumes in seconds and Telegram retries the delivery.
- **Bot silent for hours** → the pinger stopped: check cron-job.org's
  history, then open `/healthz` in a browser — expect `{"status":"ok"}`.
- **Editor very slow or an out-of-memory restart while editing** → you hit
  the 512 MB ceiling; do the edit, let it recover (data is safe in Neon), or
  assign credentials in one short session rather than leaving the editor open.
- **Webhooks 404** → `WEBHOOK_URL`/`N8N_HOST` don't exactly match the real
  `onrender.com` URL (https, no trailing slash).

## Costs

$0/month, no card anywhere: Render free web service + Neon free (0.5 GB,
auto-wake) + cron-job.org free pinger (~4 MB/day of traffic).
