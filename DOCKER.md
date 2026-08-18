# Docker Deployment Guide

This project includes a production-ready, multi-stage `Dockerfile` and `docker-compose.yml` to containerize the entire application (React frontend + Express server + Firebase integration + Gemini receipt scanning API).

---

## 1. Quick Start with Docker Compose

To build and run the container with a single command:

```bash
docker compose up --build
```

Access the application at [http://localhost:3000](http://localhost:3000).

To run in detached (background) mode:

```bash
docker compose up -d --build
```

To stop the container:

```bash
docker compose down
```

---

## 2. Manual Docker Build and Run

### Build the Image
```bash
docker build -t expense-planner .
```

### Run the Container
```bash
docker run -d \
  -p 3000:3000 \
  --name expense-planner-app \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  expense-planner
```

---

## 3. Environment Variables

| Variable | Description | Default / Required |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | `production` |
| `PORT` | HTTP port for the application | `3000` |
| `GEMINI_API_KEY` | Google Gemini API Key for receipt scanning | Optional / Recommended |

---

## 4. Multi-Stage Build Architecture

- **Stage 1 (`builder`)**: Uses `node:20-alpine`, installs all dependencies (including devDependencies), and executes `npm run build` to compile the Vite client application and bundle `server.ts` into `dist/server.cjs`.
- **Stage 2 (`runner`)**: Uses a fresh, minimal `node:20-alpine` base image, installs only production dependencies (`npm ci --omit=dev`), copies the compiled `dist/` directory and Firebase configurations, and launches the Express backend on port `3000`.
