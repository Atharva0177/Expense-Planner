#!/usr/bin/env node
/**
 * Deploys n8n/expense-planner-bot.json to a live n8n instance via the n8n
 * REST API, WITHOUT wiping credential assignments on the live workflow.
 *
 * How it works:
 *   1. Fetches all workflows via GET /api/v1/workflows
 *   2. Finds the live "Expense Planner Bot" (by name)
 *   3. Merges: new nodes/connections/settings from the repo JSON + the live
 *      nodes' `credentials` objects (matched by node name)
 *   4. PUTs the merged workflow
 *   5. Restores the previous activation state (a workflow update can
 *      deactivate it, so we re-activate via the activation endpoint)
 *   6. If no live workflow exists, creates it (inactive - assign
 *      credentials in the editor once, then activate)
 *
 * Required environment variables (GitHub secrets or local shell):
 *   N8N_API_URL   e.g. https://n8n.your-domain.com (no trailing slash)
 *   N8N_API_KEY   an n8n API key (n8n Settings -> n8n API)
 *
 * Usage: node n8n/scripts/deploy-workflow.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKFLOW_FILE = path.join(__dirname, "..", "expense-planner-bot.json");
const WORKFLOW_NAME = "Expense Planner Bot";

const API_URL = (process.env.N8N_API_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.N8N_API_KEY || "";

function die(msg) {
  console.error(`DEPLOY SKIPPED/FAILED: ${msg}`);
  process.exit(1);
}

if (!API_URL || !API_KEY) {
  console.log(
    "N8N_API_URL / N8N_API_KEY not set - skipping n8n bot deployment. " +
      "Set them as repository secrets to enable auto-deploy.",
  );
  process.exit(0); // soft-skip so CI stays green for forks without a bot
}

const headers = {
  "X-N8N-API-KEY": API_KEY,
  "Content-Type": "application/json",
  accept: "application/json",
};

async function api(method, endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    die(`${method} ${endpoint} -> HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

const desired = JSON.parse(readFileSync(WORKFLOW_FILE, "utf8"));
console.log(`Loaded "${desired.name}" (${desired.nodes.length} nodes) from repo`);

// n8n API list endpoint returns { data: [...] } (or a bare array on old versions)
const listRes = await api("GET", "/api/v1/workflows?limit=250");
const liveWorkflows = Array.isArray(listRes) ? listRes : listRes.data || [];
const live = liveWorkflows.find((w) => w.name === WORKFLOW_NAME);

if (!live) {
  console.log("No live workflow found - creating a new one (inactive).");
  const created = await api("POST", "/api/v1/workflows", {
    name: WORKFLOW_NAME,
    nodes: desired.nodes,
    connections: desired.connections,
    settings: desired.settings,
  });
  console.log(
    `Created workflow ${created.id}. Open the n8n editor once to assign ` +
      `credentials, then activate it.`,
  );
  process.exit(0);
}

// Merge live credentials into the new node set (matched by node name).
// This keeps credential assignments working across redeploys.
const liveCredentialsByName = new Map();
for (const node of live.nodes || []) {
  if (node.credentials && Object.keys(node.credentials).length > 0) {
    liveCredentialsByName.set(node.name, node.credentials);
  }
}
let merged = 0;
for (const node of desired.nodes) {
  const creds = liveCredentialsByName.get(node.name);
  if (creds) {
    node.credentials = creds;
    merged++;
  }
}
console.log(
  `Merged credentials into ${merged}/${liveCredentialsByName.size} previously-assigned nodes`,
);

const payload = {
  name: WORKFLOW_NAME,
  nodes: desired.nodes,
  connections: desired.connections,
  settings: desired.settings,
};

await api("PUT", `/api/v1/workflows/${live.id}`, payload);
console.log(`Updated workflow ${live.id}`);

// Restore activation state (PUT can deactivate an active workflow)
if (live.active) {
  try {
    await api("POST", `/api/v1/workflows/${live.id}/activate`);
    console.log("Workflow re-activated");
  } catch {
    // Some n8n versions activate through the same PUT; verify:
    const check = await api("GET", `/api/v1/workflows/${live.id}`);
    if (!check.active) {
      console.warn("Could not re-activate automatically - activate in the editor.");
    } else {
      console.log("Workflow still active");
    }
  }
} else {
  console.log("Workflow remains inactive (was inactive before deploy)");
}

console.log("n8n bot deployment complete.");
