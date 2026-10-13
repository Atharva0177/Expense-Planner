# n8n for free hosting without a credit card (Render free tier) - guide:
#   n8n/RENDER-HOSTING.md
#
# The host's disk is EPHEMERAL: everything on it is wiped on every restart or
# deploy. All persistent data (workflows, credentials, executions, workflow
# static data) therefore lives in an external FREE Neon Postgres database,
# configured entirely through environment variables set on the host - nothing
# secret is baked in here.
FROM n8nio/n8n:latest

# Recent n8n images ship no shell and no default CMD: the image's entrypoint
# starts n8n by itself. n8n binds to N8N_PORT - Render auto-detects the
# listening port for Docker services, so a fixed port is all we need.
ENV N8N_LISTEN_ADDRESS=0.0.0.0 \
    N8N_PORT=7860 \
    N8N_PROTOCOL=https \
    GENERIC_TIMEZONE=Asia/Kolkata \
    TZ=Asia/Kolkata \
    N8N_DIAGNOSTICS_ENABLED=false \
    N8N_RUNNERS_MAX_CONCURRENCY=1

# n8n 2.x always runs Code nodes in separate task-runner processes (the old
# N8N_RUNNERS_ENABLED=false toggle no longer exists). Capping concurrency at
# one serialized code-node execution bounds runner memory on a 512 MB free
# instance; a single-user Telegram bot never needs more.
# The Postgres SSL toggle is DB_POSTGRESDB_SSL_ENABLED in 2.x (renamed from
# DB_POSTGRESDB_SSL) - set in render.yaml, verified against 2.42.5.

EXPOSE 7860

# No CMD override - the image entrypoint defaults to "n8n start".
