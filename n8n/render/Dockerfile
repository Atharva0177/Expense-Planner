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
    N8N_RUNNERS_ENABLED=false

# N8N_RUNNERS_ENABLED=false runs Code nodes in-process instead of separate
# task-runner subprocesses: roughly halves memory use so n8n fits a 512 MB
# free instance.

EXPOSE 7860

# No CMD override - the image entrypoint defaults to "n8n start".
