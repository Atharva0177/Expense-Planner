# Free 24/7 hosting on Oracle Cloud (Always Free tier)

Your bot currently runs in Docker Desktop on your PC: the PC must stay on,
ngrok sits in the middle, and RAM is consumed on your daily machine. This
guide moves the exact same stack to an **Oracle Cloud Always Free** VM —
permanently free, always on, with direct HTTPS (no ngrok).

What you end up with:

```
Telegram  --HTTPS-->  Caddy (Let's Encrypt cert, auto-renewed)
                          --HTTP-->  n8n-server (Docker, same compose file)
                                          --REST-->  Firestore / Gemini
```

## Cost and limits

Oracle's Always Free tier (no expiry, no charge while you stay inside it):

| Resource | Free allowance |
|---|---|
| ARM VM (Ampere A1) | 4 OCPUs + 24 GB RAM total (n8n needs ~1) |
| Disk | 200 GB block storage total |
| Network | 10 TB egress/month, 1 reserved public IP |

Card required at signup for identity verification only. **Do not upgrade
the account to Pay As You Go** and set a budget with a ₹1 alert (Billing &
Cost Management → Budgets) so an accidental non-free resource pages you.

## Step 1 — Account and region

Sign up at `cloud.oracle.com` (needs a credit card; it is not charged for
Always Free usage). **The home region is permanent — choose carefully**:
for the free ARM shape, Mumbai (`ap-mumbai-1`) is frequently out of
capacity; Hyderabad (`ap-hyderabad-1`) and Chennai (`ap-chennai-1`) usually
have stock. If every availability domain shows "Out of capacity" later,
just retry over a day or two — capacity is released continuously.

## Step 2 — Create the VM

Compute → Instances → Create instance:

- Name: `expense-planner`
- Image: **Ubuntu 24.04** (click "Edit" next to Image and change)
- Shape: **Ampere** `VM.Standard.A1.Flex`, **2 OCPUs / 12 GB** (free cap is 4/24)
- SSH key: "Generate a key pair" → save BOTH files (the `.key` file is your login)
- Boot volume: defaults are fine (~47 GB of your 200 GB)
- Networking: create a new VCN + public subnet (defaults) and make sure
  "Assign a public IPv4 address" is checked

After it boots, note the public IP. Prefer making it **reserved**
(Networking → IP Management → Reserved public IPs) so it survives reboots.

## Step 3 — Open the firewall (two places!)

Oracle blocks ports in BOTH the security list and the instance's iptables —
you must open both or Caddy's HTTPS will silently fail.

**3a. Security list** (Networking → Virtual Cloud Networks → your VCN →
Security Lists → Default):

Ingress rules for `0.0.0.0/0`: TCP **443**, TCP **80**. Keep SSH (22) but
ideally restrict its source to your home IP.

**3b. Instance iptables** (Oracle Ubuntu images ship a REJECT-all rule):

```bash
ssh -i <your-key>.key ubuntu@<VM-IP>
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save
```

## Step 4 — Free hostname (DuckDNS)

Telegram webhooks need a trusted HTTPS URL, which needs a hostname (Let's
Encrypt cannot issue certificates for bare IPs):

1. Sign in at `duckdns.org` (Google login), pick a subdomain, e.g.
   `expenseplanner.duckdns.org`
2. Set its IPv4 address to your VM's public IP (one time — the reserved IP
   is static)

## Step 5 — Install Docker and the repo on the VM

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # then log out and back in
git clone https://github.com/Atharva017m/Expense-Planner.git
cd Expense-Planner
nano .env
```

`.env` on the VM needs these (other keys like GEMINI_API_KEY are not used
by the bot profile):

```ini
TELEGRAM_BOT_TOKEN="..."                          # same bot token as before
N8N_ENCRYPTION_KEY="..."                          # same key as your PC if you
                                                   # migrate data (Step 8)
N8N_HOST="expenseplanner.duckdns.org"             # your DuckDNS hostname
N8N_WEBHOOK_URL="https://expenseplanner.duckdns.org"
```

## Step 6 — Start it

```bash
docker compose --profile oracle up -d n8n-server caddy
```

(Service names are explicit so the website container is not started too.)

Open `https://expenseplanner.duckdns.org` — after ~1 minute (first
certificate issuance) you get n8n's first-run screen: create the owner
account. **Enable 2FA** in the same screen (the editor is now public).

Editor fallback if Caddy/HTTPS has issues:
`ssh -L 5678:localhost:5678 ubuntu@<VM-IP>` → `http://localhost:5678`.

## Step 7 — Import the workflow

Identical to the local setup (see n8n/README.md → Setup):

1. Import `n8n/expense-planner-bot.json`
2. Assign the three credentials (Telegram API, Google Service Account API,
   Header Auth for Gemini — the exact checklist is in n8n/README.md)
3. Activate → Publish, send `/setup-menu` once
4. If you use the CI auto-deploy, update the GitHub `N8N_API_URL` secret to
   `https://expenseplanner.duckdns.org` and create a fresh `N8N_API_KEY`
   (new instance, new key)

## Step 8 — Turn off the local bot (important!)

```bash
# on your PC:
docker compose --profile n8n down
```

Telegram allows only ONE webhook per bot token. If both your PC instance
and the VM instance stay active, whichever registered last steals the
messages and you get confusing behavior.

## Optional — migrate your existing data

Moves credentials, execution history and settings (requires the SAME
`N8N_ENCRYPTION_KEY` as your PC instance):

```bash
# on the PC, with local n8n STOPPED:
docker volume ls | grep n8n          # find the exact volume name
docker run --rm -v <that-volume-name>:/data -v ${PWD}:/backup alpine \
  tar czf /backup/n8n-data.tgz -C /data .
scp n8n-data.tgz ubuntu@<VM-IP>:

# on the VM (compose creates expense-planner_n8n_server_data on first start):
docker compose --profile oracle up -d n8n-server caddy
docker run --rm -v expense-planner_n8n_server_data:/data -v ${PWD}:/backup alpine \
  tar xzf /backup/n8n-data.tgz -C /data
docker compose --profile oracle restart n8n-server
```

If you skip migration, just re-import the workflow and re-assign the three
credentials on the fresh instance.

## Maintenance

```bash
docker compose --profile oracle pull n8n-server caddy
docker compose --profile oracle up -d n8n-server caddy
docker logs -f expense_planner_n8n_server    # tail bot logs
```

## Troubleshooting

- **"Out of capacity" when creating the A1 instance** — try another
  availability domain/region, retry over a couple of days, or temporarily
  use a 1 OCPU/6 GB shape and resize later.
- **Caddy logs show a Let's Encrypt rate-limit error** — `*.duckdns.org` is
  a shared domain and occasionally hits issuance limits. Caddy retries
  automatically; if it persists, re-check Steps 3a/3b, or fall back to
  running the ngrok profile on the VM instead.
- **Webhook 404 / bot silent** — confirm `N8N_WEBHOOK_URL` matches the
  hostname Caddy serves exactly (https, no trailing slash), that the
  workflow is Active, and that the PC instance is down (Step 8).
- **Editor loads oddly through the tunnel port** — that's expected with
  `N8N_HOST` pointing at the domain; use `https://<duckdns-host>` directly.
