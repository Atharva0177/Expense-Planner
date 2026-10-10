# Expense Planner

A comprehensive personal and family finance management application with AI-powered receipt scanning, multi-user household support, and sophisticated financial tracking.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [API Reference](#api-reference)
- [Authentication & Authorization](#authentication--authorization)
- [Core Feature Workflows](#core-feature-workflows)
- [Data Flow](#data-flow)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Installation & Local Development](#installation--local-development)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Docker](#docker)
- [Build Process](#build-process)
- [CI/CD](#ci-cd)
- [Deployment](#deployment)
- [Security](#security)
- [Performance](#performance)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Extending the Application](#extending-the-application)
- [Architectural Decisions](#architectural-decisions)
- [Known Limitations](#known-limitations)
- [FAQ](#faq)
- [Glossary](#glossary)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

Expense Planner is a full-stack web application designed for personal and family financial management. It enables users to track income, expenses, budgets, loans, investments, and goals with AI-powered receipt scanning capabilities. The application supports multi-user households with role-based access (primary, spouse, dependent) and provides comprehensive financial reporting.

Built with React/Vite frontend and Node.js/Express backend, the application uses Firebase Firestore as its primary database and integrates with Google's Gemini AI for receipt processing. The application can be deployed via Docker, Vercel (serverless functions), or traditional Node.js hosting. A self-hosted **n8n** workflow adds a full-featured **Telegram bot** that reads and writes the same Firestore data.

## Key Features

- **AI-Powered Receipt Scanning**: Upload receipt images to automatically extract amount, date, merchant, and category using Google Gemini AI
- **Receipt Photo Attachments (free-tier friendly)**: scanned receipt photos are compressed and stored **inside Firestore** (collection `receipt_photos/{txId}`, lazy-loaded) — no Firebase Cloud Storage or Blaze billing required; click the 📎 on any entry to view its photo
- **Full Editing & Split Transactions**: edit any transaction or income entry (amount, category, date, note, mode) via modals; split one amount into up to 5 equal entries
- **Payslip / Form 16 Parsing**: upload a payslip image on the Income tab → AI extracts all salary components (basic, HRA, allowances, EPF, TDS, net) and prefills the entry form (`/api/parse-payslip`)
- **Search Across Everything**: search bar on the Expenses tab matches notes, categories, payment modes, amounts, and dates across **all months**
- **Telegram Bot (n8n)**: A self-hosted n8n workflow (`n8n/expense-planner-bot.json`, 114 nodes) giving Telegram near-full parity with the website:
  - Log expenses (`/spent`), natural-language logging (plain text like "spent 250 on groceries"), scan receipt photos with inline Save/Discard confirmation, record income (`/earned`), and undo mistakes (`/undo`)
  - Budgets (`/budget`, `/budgets`), savings goals (`/goal`, `/goals`, `/contribute`), loans with full amortization schedules (`/loan`, `/loans`), and recurring rules (`/recurring`, `/recurrings`)
  - Views: monthly summary with savings rate, recent entries, budgets, goals, loans, recurring rules, household members, investments, categories, CSV export - plus `/ask <question>` to chat with your data
  - **Daily 9 AM auto-processing of due recurring rules** — something the website only does when its Recurring tab is opened
  - Multi-receipt albums, `/edit` for the last entry, a native Telegram command menu (`/setup-menu`), and HTML-escaped / CSV-injection-guarded replies
  - Everything writes the same Firestore collections as the website, so bot entries appear on the dashboard instantly and vice versa
- **Multi-User Household Support**: Create or join households with role-based permissions (primary, spouse, dependent)
- **Comprehensive Financial Tracking**:
  - Income tracking with detailed breakdown (basic, HRA, allowances, bonuses, deductions)
  - Expense categorization with customizable categories
  - Budget management with monthly limits per category
  - Loan & EMI tracking with amortization schedules
  - Investment portfolio tracking
  - Savings goals with target amounts and dates
  - Tax calculations for old vs new regime comparison
- **Recurring Transactions**: Automate regular expenses and incomes with flexible frequency (monthly, quarterly, yearly)
- **Data Export**: Export financial reports in various formats
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Theme Support**: Light/dark mode with system preference detection
- **Secure Authentication**: Firebase Auth with email/password providers
- **Offline Capabilities**: Firestore persistence for intermittent connectivity
- **Multiple Deployment Options**: Traditional Express server (Docker/Node.js), Vercel serverless functions, or Cloudflare Pages
- **CI/CD Pipeline**: GitHub Actions workflow for linting, testing, building, security auditing, and automated deployment to Vercel and Docker registry

## Technology Stack

### Frontend

- **React 19**: UI library for building interactive components
- **Vite 6**: Build tool and development server for fast module replacement
- **React Router DOM 7**: Client-side routing for SPA navigation
- **Tailwind CSS 4**: Utility-first CSS framework for styling
- **Headless UI**: Accessible UI components (via Heroicons/lucide-react)
- **Firebase JavaScript SDK**: Auth and Firestore integration
- **Lucide React**: Beautifully designed icon set
- **Recharts**: Charting library for data visualization
- **JSPdf**: PDF generation for reports
- **Heic2any**: HEIC image format conversion for iOS photos

### Backend

- **Node.js**: JavaScript runtime
- **Express 4**: Web framework for API server
- **Firebase Admin SDK**: Server-side Firestore access (Cloudflare Pages Functions)
- **Google Generative AI (@google/genai)**: Gemini AI integration for receipt scanning
- **Dotenv**: Environment variable loading
- **TSX**: TypeScript execution for development
- **ESBuild**: Bundling for production server
- **Vercel**: Serverless functions platform (api/scan-receipt.ts)

### Automation (Telegram bot)

- **n8n** (self-hosted, Docker Compose profile): 95-node workflow implementing the Telegram bot — Telegram Trigger + Gemini HTTP calls + Firestore REST reads/writes + a daily Schedule Trigger for recurring processing
- **ngrok**: Free static-domain tunnel exposing the local n8n instance to Telegram's webhook

### Database

- **Firebase Firestore**: NoSQL document database with real-time capabilities
- **Firebase Authentication**: User authentication service

### DevOps & Infrastructure

- **Docker**: Containerization with multi-stage build
- **Docker Compose**: Orchestration for the app plus the `n8n` profile (n8n + ngrok tunnel for the Telegram bot)
- **Vercel**: Serverless deployment platform
- **Cloudflare Pages**: Alternative static + functions hosting (`functions/`)
- **GitHub Actions**: CI/CD pipeline (lint, test, build, security audit, deploy)
- **Bun**: Package manager (indicated by bun.lockb)
- **GHCR**: GitHub Container Registry for Docker image storage

### Development Tools

- **TypeScript**: Static typing for JavaScript
- **ESLint**: Code linting (via tsc --noEmit)
- **Prettier**: Code formatting (configured via editor settings)

## Architecture

The application follows a three-tier architecture with multiple deployment options, plus an n8n automation tier for the Telegram bot:

```mermaid
flowchart TD
    A[Client Browser] -->|HTTPS/WSS| B[Backend API]
    B -->|Firestore SDK| C[(Firebase Firestore)]
    B -->|Generative AI API| D[Google Gemini]
    A -->|Static Assets| B
    E[Telegram Chat] -->|webhook via ngrok| F[n8n Bot Workflow]
    F -->|Firestore REST + service account| C
    F -->|receipt photos| D

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#fbb,stroke:#333,stroke-width:2px
    style E fill:#ffd,stroke:#333,stroke-width:2px
    style F fill:#dff,stroke:#333,stroke-width:2px
```

### High-Level Components

1. **Client Layer**: React/Vite SPA handling UI rendering and user interactions
2. **API Layer**:
   - Express server (local/Docker) handling business logic and data validation
   - Vercel serverless function (`api/scan-receipt.ts`) and Cloudflare Pages Functions (`functions/api/scan-receipt.ts`) for AI receipt processing in serverless environments
3. **Data Layer**: Firestore for persistent storage with caching layer
4. **Automation Layer**: the n8n Telegram bot workflow — same Firestore database, service-account-authenticated REST reads/writes, plus a daily Schedule Trigger for recurring-rule processing
5. **External Services**: Google Gemini AI for receipt processing, Firebase Auth for authentication, ngrok for the bot's public webhook

### Communication Patterns

- Client ↔ API: RESTful JSON over HTTPS
- API ↔ Firestore: Firebase Admin SDK (direct database access)
- API ↔ Gemini: HTTP POST to generativelanguage.googleapis.com
- Client ↔ Gemini (fallback): Direct API calls when configured with client-side key
- Telegram ↔ n8n: webhook via ngrok static domain; n8n ↔ Firestore: REST API with a Google service account (bypasses security rules); n8n ↔ Gemini: HTTP with structured output

## Directory Structure

```
expense-planner/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers (Auth, Theme)
│   ├── lib/                # Data & service libraries (Firebase, db, tax, exports, utils)
│   ├── pages/              # Page components (Dashboard, Login)
│   ├── types.ts            # TypeScript interfaces and enums
│   ├── App.tsx             # Root application component
│   └── main.tsx            # Application entry point
├── server.ts               # Backend Express server (/api/health, /api/scan-receipt)
├── api/                    # Vercel serverless functions
│   ├── scan-receipt.ts     # AI receipt scanning endpoint for Vercel
│   └── health.ts           # Health check endpoint for Vercel
├── functions/api/          # Cloudflare Pages Functions (web app receipt scanning + health)
├── n8n/                    # Telegram bot automation (self-hosted n8n)
│   ├── expense-planner-bot.json  # Importable n8n workflow (114 nodes, 2 triggers) - GENERATED, see generate-workflow.cjs
│   ├── generate-workflow.cjs     # Source of truth for the workflow JSON (npm run bot:generate)
│   ├── validators/               # 128-test logic suite + graph/wiring/code validators (npm run bot:validate)
│   ├── scripts/deploy-workflow.mjs  # CI auto-deploy to live n8n via REST API (credential-preserving)
│   ├── classify-update.js  # Standalone export of the Classify Update node code (hot-fix pasting)
│   └── README.md           # Bot setup & operations guide
├── public/                 # Static assets
├── dist/                   # Build output (generated)
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # App + `n8n` profile (n8n + ngrok tunnel)
├── .env.example            # Template for environment variables
├── vercel.json             # Vercel platform configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .github/workflows/ci-cd.yml  # CI/CD pipeline
└── firebase-applet-config.json  # Fallback Firebase configuration
```

## Frontend Architecture

The frontend is a single-page application built with React and Vite, utilizing a context-based state management approach for authentication and theme state.

### Core Architecture

```mermaid
flowchart LR
    A[Browser] --> B[Index.html]
    B --> C[React Root]
    C --> D[ThemeProvider]
    D --> E[AuthProvider]
    E --> F[BrowserRouter]
    F --> G[Routes]

    G --> H["/login - Login Page"]
    G --> I["/ - Dashboard"]

    I --> J[ProtectedRoute Wrapper]
    J --> K[Dashboard Layout]
    K --> L[Section Components]

    L --> M[OverviewSection]
    L --> N[ExpenseSection]
    L --> O[IncomeSection]
    L --> P[BudgetSection]
    L --> Q["...Other Sections"]

    style A fill:#f9f,stroke:#333,stroke-width:1px
    style B fill:#eee,stroke:#333,stroke-width:1px
    style C fill:#dfd,stroke:#333,stroke-width:1px
    style D fill:#cfc,stroke:#333,stroke-width:1px
    style E fill:#bfb,stroke:#333,stroke-width:1px
    style F fill:#afa,stroke:#333,stroke-width:1px
    style G fill:#9f9,stroke:#333,stroke-width:1px
    style H fill:#fe9,stroke:#333,stroke-width:1px
    style I fill:#fd9,stroke:#333,stroke-width:1px
    style J fill:#fc9,stroke:#333,stroke-width:1px
    style K fill:#fb9,stroke:#333,stroke-width:1px
    style L fill:#fa9,stroke:#333,stroke-width:1px
    style M fill:#f99,stroke:#333,stroke-width:1px
    style N fill:#f88,stroke:#333,stroke-width:1px
    style O fill:#f77,stroke:#333,stroke-width:1px
    style P fill:#f66,stroke:#333,stroke-width:1px
    style Q fill:#f55,stroke:#333,stroke-width:1px
```

### State Management

- **AuthContext**: Manages Firebase user state, household membership, and loading states
- **ThemeContext**: Handles light/dark mode preferences with system detection
- **React Query-like Caching**: Custom caching layer in lib/db.ts for Firestore queries with 25s TTL
- **Local State**: Component-level state for form inputs and UI flags

### Key Components

- **ExpenseSection**: Primary interface for logging expenses with AI receipt scanning
- **Dashboard**: Main layout with tabbed navigation for different financial sections
- **AuthContext**: Firebase authentication wrapper with automatic household creation
- **ThemeContext**: CSS variable-based theming with Tailwind CSS integration
- **ReceiptScanner**: Library handling client-server fallback for Gemini AI integration

## Backend Architecture

The backend is a Node.js Express server that handles API requests, business logic, and Firebase interactions. A Vercel serverless function provides the same AI receipt scanning capability for serverless deployments.

### Request Flow (Express Server)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Express Server
    participant F as Firestore
    participant G as Gemini AI

    C->>S: HTTPS Request (e.g. POST /api/scan-receipt)
    S->>S: Validate middleware (JSON parsing)

    alt Has Gemini API Key in request
        S->>G: Call Generative AI API
        G-->>S: Return structured receipt data
    else No Gemini API Key
        S->>F: Fetch user data if needed
        S->>S: Process locally if applicable
    end

    S->>F: Store/retrieve transaction data
    F-->>S: Return Firestore response
    S-->>C: JSON Response with data/error
```

### Request Flow (Vercel Serverless Function)

```mermaid
sequenceDiagram
    participant C as Client
    participant V as Vercel Function
    participant G as Gemini AI
    participant F as Firestore

    C->>V: HTTPS Request (POST /api/scan-receipt)
    V->>V: Parse JSON
    V->>V: Validate body and size limit

    alt Gemini API Key configured
        V->>G: Call Generative AI API
        G-->>V: Structured receipt data
        V->>V: Validate Gemini response

        V->>F: Store transaction via Firebase Admin SDK
        F-->>V: Firestore response

        V-->>C: 200 JSON Response
    else Gemini API Key missing
        V-->>C: 500 Error - Missing API Key
    end
```

### Middleware (Express)

1. **securityHeaders**: nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP on all responses
2. **globalLimiter**: 300 requests / 15 min / IP (dependency-free fixed-window)
3. **scanLimiter**: 20 requests / hour / IP on `/api/scan-receipt` (protects expensive AI calls)
4. **express.json()**: Body parsing with 25MB limit
5. **Vite Middleware**: In development, serves client SPA and enables HMR
6. **Static File Serving**: In production, serves built client assets

### Middleware (Vercel Function)

- Built-in body parser with 10MB limit (see `api/scan-receipt.ts` config)
- Automatic runtime isolation and scaling

### Core Modules

- **server.ts**: Main entry point with route definitions and middleware setup
- **api/scan-receipt.ts**: Vercel serverless function for AI receipt scanning
- **Firebase Integration**: Initialized in src/lib/firebase.ts with fallback configuration
- **Receipt Scanning**: Google Gemini AI integration with multiple model fallbacks
- **Error Handling**: Centralized error logging with Firestore operation tracking

## Database Architecture

The application uses Firebase Firestore as its primary database with a denormalized schema optimized for financial data access patterns.

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||..|{ HOUSEHOLD-MEMBER : belongs
    USER ||..|{ HOUSEHOLD : creates
    HOUSEHOLD ||..|{ HOUSEHOLD-MEMBER : contains
    HOUSEHOLD-MEMBER ||..|{ TRANSACTION : makes
    HOUSEHOLD-MEMBER ||..|{ INCOME-EARN : earns
    HOUSEHOLD-MEMBER ||..|{ BUDGET : sets
    HOUSEHOLD-MEMBER ||..|{ RECURRING-RULE : creates
    HOUSEHOLD-MEMBER ||..|{ LOAN : takes
    HOUSEHOLD-MEMBER ||..|{ GOAL : sets
    HOUSEHOLD-MEMBER ||..|{ TAX-CALCULATION : generates
    TRANSACTION }|..|{ CATEGORY : categorized
    LOAN ||..|{ LOAN-SCHEDULE : has
    USER }|..|{ INVESTMENT-ACCOUNT : owns
    INVESTMENT-ACCOUNT ||..|{ INVESTMENT-HOLDING : contains
    INVESTMENT-ACCOUNT ||..|{ INVESTMENT-VALUATION : values
```

### Collections Structure

#### households

- `name`: string
- `created_by`: string (userId)
- `created_at`: timestamp

#### household_members

- `household_id`: string (reference to households)
- `user_id`: string (reference to Firebase Auth users)
- `email`: string
- `role`: string (primary/spouse/dependent/other)
- `joined_at`: timestamp

#### transactions

- `user_id`: string
- `household_id`: string (optional, for household-scoped transactions)
- `category_id`: string (references category name)
- `amount`: number
- `date`: string (YYYY-MM-DD)
- `note`: string
- `payment_mode`: string (UPI/Card/Cash/Netbanking/Other)
- `source`: string (manual/recurring/csv_import)
- `created_at`: timestamp

#### income_entries

- `user_id`: string
- `household_id`: string (optional)
- `month`: string (YYYY-MM)
- `basic`, `hra`, `special_allowance`, `bonus`, `other`: numbers
- `epf_deduction`, `professional_tax`, `tds`: numbers
- `net_credited`: number
- `created_at`: timestamp

#### budgets

- `user_id`: string
- `household_id`: string (optional)
- `category_id`: string
- `month`: string (YYYY-MM)
- `limit_amount`: number
- `created_at`: timestamp

#### recurring_rules

- `user_id`: string
- `household_id`: string (optional)
- `category_id`: string
- `amount`: number
- `frequency`: string (monthly/quarterly/yearly)
- `next_due_date`: string (YYYY-MM-DD)
- `label`: string
- `active`: boolean
- `created_at`: timestamp

#### loans

- `user_id`: string
- `household_id`: string (optional)
- `principal`: number
- `interest_rate`: number (annual percentage)
- `tenure_months`: number
- `start_date`: string (YYYY-MM-DD)
- `emi_amount`: number
- `created_at`: timestamp

#### loan_schedules

- `loan_id`: string
- `user_id`: string
- `household_id`: string (optional)
- `month_number`: number
- `principal_component`: number
- `interest_component`: number
- `outstanding_balance`: number
- `is_prepayment`: boolean

#### goals

- `user_id`: string
- `household_id`: string (optional)
- `name`: string
- `target_amount`: number
- `target_date`: string (YYYY-MM-DD)
- `current_amount`: number
- `linked_recurring_rule_id`: string (nullable)
- `created_at`: timestamp

#### tax_calculations

- `user_id`: string
- `financial_year`: string
- `gross_income`: number
- `hra_exemption`: number
- `eighty_c`: number
- `eighty_d`: number
- `home_loan_interest`: number
- `other_deductions`: number
- `old_regime_tax`: number
- `new_regime_tax`: number
- `recommended_regime`: string (old/new)
- `created_at`: timestamp

#### categories

- `user_id`: string (or "system" for defaults)
- `name`: string
- `type`: string (fixed/custom)
- `is_default`: boolean
- `created_at`: timestamp

#### investment_accounts

- `user_id`: string
- `household_id`: string (optional)
- `type`: string (mutual_fund/stock/fd/ppf/nps/gold/other)
- `custom_type_description`: string (optional)
- `name`: string
- `folio_number`: string (optional)
- `created_at`: timestamp

#### investment_holdings

- `investment_account_id`: string
- `user_id`: string
- `units`: number (nullable)
- `amount`: number (for FD/PPF)
- `purchase_price`: number
- `purchase_date`: string (YYYY-MM-DD)
- `created_at`: timestamp

#### investment_valuations

- `investment_account_id`: string
- `user_id`: string
- `date`: string (YYYY-MM-DD)
- `price_or_nav`: number
- `total_value`: number
- `created_at`: timestamp

### Indexing Strategy

Firestore automatically creates indexes for:

- Single field queries
- Compound queries based on query patterns in the code
- Collection group queries (not used)

The application relies on Firestore's automatic indexing for most queries, with composite indexes implicitly created through query patterns.

## API Reference

### Health Check

| Method | Endpoint      | Auth | Purpose                                    |
| ------ | ------------- | ---- | ------------------------------------------ |
| GET    | `/api/health` | None | Returns server status and environment info |

### Receipt Scanning

| Method | Endpoint            | Auth | Purpose                                             |
| ------ | ------------------- | ---- | --------------------------------------------------- |
| POST   | `/api/scan-receipt` | None | Upload receipt image for AI-powered data extraction |

> Note: Telegram bot receipt scanning does **not** go through this endpoint — the n8n workflow calls the Gemini API directly. This endpoint serves the website's in-app receipt scanner (Express / Vercel / Cloudflare Pages variants of it are all equivalent).

**Request Body:**

```json
{
  "imageBase64": "string (base64 encoded image)",
  "mimeType": "string (e.g., image/jpeg, image/png)"
}
```

**Success Response (200):**

```json
{
  "amount": number,
  "date": "string (YYYY-MM-DD)",
  "merchant": "string",
  "category": "string"
}
```

**Error Responses:**

- 400: Missing image data
- 413: Image too large
- 415: Unsupported image type (JPEG/PNG/WebP/HEIC/HEIF/GIF only)
- 429: Rate limit exceeded (with `Retry-After` header)
- 500: AI processing failure or server error
- 503: Gemini service unavailable (transient)

### Rate Limiting

- **Express Server** (dependency-free, fixed-window, per-IP):
  - Global Limiter: 300 requests per 15 minutes
  - Scan Receipt Limiter: 20 requests per hour (protects expensive AI operations); 429 responses include `Retry-After`
- **Vercel Function**: Inherits Vercel's default limits (can be adjusted in vercel.json if needed)
- **Telegram bot**: protected by the n8n trigger's **user-ID allowlist** rather than rate limiting

### Security Headers

- **Express**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, and a conservative CSP on all responses (see `server.ts`)
- **Vercel**: `X-Content-Type-Options: nosniff` via `vercel.json`
- **Serverless scan functions**: `nosniff` on all responses

### CORS

Not configured on the Express server (same-origin in practice: the server also serves the frontend). Vercel functions follow Vercel's CORS handling.

## Authentication & Authorization

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant F as Firebase Auth
    participant S as Express Server
    participant V as Vercel Function
    participant DB as Firestore

    U->>B: Visit /login
    B->>F: Sign in with email/password
    F-->>B: Return Firebase ID token

    B->>B: Store authentication state

    alt Request handled by Express Server
        B->>S: API request with ID token
        S->>F: Verify token via Firebase Admin SDK
        F-->>S: Token validity and user information
        S->>DB: Fetch household membership
        DB-->>S: Household data
        S-->>B: Authenticated response
    else Request handled by Vercel Function
        B->>V: API request with ID token
        V->>F: Verify token via Firebase Admin SDK
        F-->>V: Token validity and user information
        V->>DB: Fetch household membership
        DB-->>V: Household data
        V-->>B: Authenticated response
    end
```

### Authorization Model

- **Resource Ownership**: Most data is scoped by `user_id` or `household_id`
- **Household Scoping**:
  - Primary members can view/edit all household data
  - Spouse members have similar privileges to primary
  - Dependent members have restricted access (cannot modify certain settings)
  - Role-based visibility in UI (see Dashboard.tsx visibleTabs filtering)
- **Data Access Rules**:
  - Transactions, incomes, budgets: Scoped to household_id when available, fallback to user_id
  - Invites: Household-specific invitation system
  - Investment data: Can be household-scoped or personal

### Authentication Implementation

- **Frontend**: Firebase JavaScript SDK (`src/lib/firebase.ts`)
- **Backend**: Firebase Admin SDK for token verification (implicit in Firestore security rules)
- **Serverless Functions**: Firebase Admin SDK initialized via environment variables
- **Session Management**: Firebase ID tokens stored client-side, verified on each request via Firestore rules
- **Password Security**: Firebase Auth handles secure password storage with hashing and salting

### Protected Routes

All routes except `/login` are protected by the `ProtectedRoute` component which:

1. Checks AuthContext for user and loading state
2. Redirects to `/login` if not authenticated
3. Shows loading spinner during initialization

## Core Feature Workflows

### Receipt Scanning Workflow

```mermaid
flowchart TD
    A[User Uploads Receipt Image] --> B{Client-Side API Key?}
    B -->|Yes| C[Direct Gemini API Call]
    B -->|No| D[Request to /api/scan-receipt]
    D --> E{Server Has API Key?}
    E -->|Yes| F[Server Calls Gemini API]
    E -->|No| G[Return 405/404 Error]
    G --> H{Client-Side API Key Available?}
    H -->|Yes| C
    H -->|No| I[Show Error: Enter API Key]
    C --> J{Gemini Response Successful?}
    J -->|Yes| K[Parse Amount, Date, Merchant, Category]
    J -->|No| L[Retry with Different Model]
    L --> M{Max Retries Exceeded?}
    M -->|Yes| N[Show Error]
    M -->|No| L
    K --> O[Populate Form Fields]
    O --> P[User Reviews and Submits]
    P --> Q[Add Transaction to Firestore]
    Q --> R[Update UI with New Transaction]
    style A fill:#f9f,stroke:#333,stroke-width:1px
    style B fill:#bbf,stroke:#333,stroke-width:1px
    style C fill:#bfb,stroke:#333,stroke-width:1px
    style D fill:#fbb,stroke:#333,stroke-width:1px
    style E fill:#ff9,stroke:#333,stroke-width:1px
    style F fill:#9f9,stroke:#333,stroke-width:1px
    style G fill:#fe9,stroke:#333,stroke-width:1px
    style H fill:#fd9,stroke:#333,stroke-width:1px
    style I fill:#fc9,stroke:#333,stroke-width:1px
    style J fill:#fa9,stroke:#333,stroke-width:1px
    style K fill:#f99,stroke:#333,stroke-width:1px
    style L fill:#f88,stroke:#333,stroke-width:1px
    style M fill:#f77,stroke:#333,stroke-width:1px
    style N fill:#f66,stroke:#333,stroke-width:1px
    style O fill:#f55,stroke:#333,stroke-width:1px
    style P fill:#f44,stroke:#333,stroke-width:1px
    style Q fill:#f33,stroke:#333,stroke-width:1px
    style R fill:#f22,stroke:#333,stroke-width:1px
```

### Transaction Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (React)
    participant S as Express Server
    participant V as Vercel Function
    participant F as Firestore
    participant G as Gemini AI

    U->>C: Fill expense form (manual or scan)

    alt Manual Entry
        C->>C: Validate expense form
    else Receipt Scanning
        C->>S: POST /api/scan-receipt
        S->>G: Send receipt for AI processing
        G-->>S: Return extracted receipt data
        S-->>C: Return scanned data

        C->>C: Populate form with scanned data
        C->>C: Review and validate extracted data
    end

    alt Express API
        C->>S: POST transaction data
        S->>F: Validate and insert transaction
        F-->>S: Return document ID
        S-->>C: Success response
    else Vercel API
        C->>V: POST transaction data
        V->>F: Validate and insert transaction
        F-->>V: Return document ID
        V-->>C: Success response
    end

    C->>C: Clear form
    C->>C: Refetch transactions
    C-->>U: Display updated expense list
```

### Household Invitation Workflow

```mermaid
sequenceDiagram
    actor P as Primary Member
    actor S as System
    actor F as Firebase
    actor I as Invitee

    P->>S: Request invite for email
    S->>F: Create invite document with code and expiry
    F-->>S: Invite created
    S-->>P: Return invite code

    P->>I: Share invite code
    I->>S: Submit email and invite code

    S->>F: Validate invite (pending, not expired)
    F-->>S: Valid invite

    S->>F: Create or update household membership
    S->>F: Mark invite as accepted

    S-->>I: Success - redirect to app
```

### Telegram Bot Workflow (n8n)

The Telegram bot runs as a self-hosted [n8n](https://n8n.io) workflow — not as code in this repo's serverless/worker files (those earlier implementations have been removed). It shares the website's Firestore database directly, so bot entries and website data are always in sync.

```mermaid
flowchart LR
    T[Telegram Chat] -->|Updates via ngrok webhook| N[n8n: expense-planner-bot]
    N -->|/spent, /earned, /budget, /goal, /loan, ...| F[(Firestore)]
    N -->|Receipt photo| G[Gemini AI]
    G -->|amount, date, merchant, category| F
    N -->|daily 9 AM| R[Process due recurring rules]
    R --> F
    F -->|Replies: confirmations, summaries, budget warnings| T
```

- **Expense text**: `/spent 250 groceries big bazaar` writes a `transactions` doc with `source: "telegram"` and `user_id: "telegram_<tg-id>"`
- **Receipt photos**: sent to Gemini with a structured response schema, then auto-logged with `source: "telegram_receipt"`
- **Income**: `/earned 50000 salary` writes an `income_entries` doc for the current month
- **Summary**: `/summary [YYYY-MM]` replies with spend, income, savings rate, and top categories
- **Household linking**: `/join <invite code>` links the Telegram account to a web-app household (code from the website's Family tab), after which all bot entries appear on the website dashboard, budgets, and reports
- **Budgets**: `/budget <category> <amount>` sets monthly limits (visible/editable on the website), `/budgets` shows budget vs spend
- **Goals**: `/goal <name> <amount> [date]` creates goals, `/goals` lists progress, `/contribute <goal> <amount>` adds money
- **Loans**: `/loan <principal> <rate%> <months>` creates the loan with a full amortization schedule and a monthly EMI rule (identical math to the website); `/loans` lists them
- **Recurring rules**: `/recurring <amount> <freq> <category>` creates rules; a daily 9 AM n8n schedule processes due rules automatically (the website only processes on tab open)
- **Utilities**: `/undo` deletes the last entry, `/recent` lists the last 10, `/export` sends a CSV, `/categories`, `/members`, `/investments`
- **Budget warnings**: replies flag when a category crosses 80% or exceeds its monthly budget
- **Category matching**: multi-word categories resolve correctly, unknown categories return "Did you mean ...?" suggestions
- **Out of scope**: the interactive tax planner, PDF/Excel exports, investment holdings entry, and CSV import stay website-only

Setup instructions (Docker Compose profile, credentials, import, security allowlist) live in [`n8n/README.md`](n8n/README.md).

## Data Flow

### Receipt Scanning Data Flow

1. **Input**: User selects image file (JPG, PNG, HEIC)
2. **Processing**:
   - Client converts HEIC to JPEG if needed (`processImageForOCR`)
   - Attempts direct Gemini call if client API key available
   - Falls back to `/api/scan-receipt` endpoint (Express or Vercel)
   - Server validates image and calls Gemini AI with multiple model fallbacks
3. **Output**: JSON with `{amount, date, merchant, category}`
4. **Consumption**: Frontend populates form fields with extracted data
5. **Storage**: On form submit, transaction saved to Firestore transactions collection

### Monthly Data Flow

```mermaid
flowchart LR
    A[User Actions] --> B[Frontend State Updates]
    B --> C[Firestore Writes via lib/db.ts]
    C --> D[(Firestore Database)]
    D --> E[Real-time Listeners]
    E --> B
    B --> F[UI Re-render]
    style A fill:#f9f,stroke:#333,stroke-width:1px
    style B fill:#bbf,stroke:#333,stroke-width:1px
    style C fill:#bfb,stroke:#333,stroke-width:1px
    style D fill:#fbb,stroke:#333,stroke-width:1px
    style E fill:#ff9,stroke:#333,stroke-width:1px
    style F fill:#9f9,stroke:#333,stroke-width:1px
```

### Cache Flow

The application implements a multi-layer caching strategy:

1. **Memory Cache**: 25-second TTL for frequently accessed data (transactions, budgets, etc.)
2. **Household Cache**: 30-second TTL for household-related data
3. **Firestore**: Persistent storage with automatic indexing
4. **Client-Side**: LocalStorage for Gemini API key (optional)

## Configuration

### Important Files

- `vite.config.ts`: Vite build configuration with React plugin and Tailwind integration
- `tsconfig.json`: TypeScript configuration with strict mode and path mapping
- `server.ts`: Express server configuration and middleware
- `api/scan-receipt.ts`: Vercel serverless function for AI receipt scanning
- `Dockerfile`: Multi-stage container build instructions
- `docker-compose.yml`: Service definition for local development
- `vercel.json`: Vercel platform configuration for serverless functions
- `.github/workflows/ci-cd.yml`: GitHub Actions CI/CD pipeline
- `.env.example`: Template for environment variables

### Build Configuration

**vite.config.ts**:

- Plugins: `@vitejs/plugin-react`
- Build: `outDir: dist`, `emptyOutDir: true`
- Server: Proxy configuration for development (if needed)

**tsconfig.json**:

- Target: ES2020
- Module: ESNext
- ModuleResolution: Bundler
- Strict: true
- NoEmit: true (lint-only checking)
- JSX: react-jsx

## Environment Variables

| Variable                            | Required                                  | Purpose                                         | Used By                                                                                |
| ----------------------------------- | ----------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                    | No (but recommended for receipt scanning) | Google Gemini API key for AI receipt processing | Backend server (`server.ts`), Vercel function (`api/scan-receipt.ts`), Client fallback |
| `VITE_GEMINI_API_KEY`               | No                                        | Client-side fallback API key for static hosting | Frontend (`src/lib/receiptScanner.ts`)                                                 |
| `NODE_ENV`                          | Yes (defaults to production)              | Environment mode (development/production)       | Build scripts, server.ts                                                               |
| `PORT`                              | Yes (defaults to 3000)                    | HTTP port for server                            | server.ts, Dockerfile, docker-compose                                                  |
| `APP_URL`                           | No                                        | Application URL for email links                 | Not actively used in codebase                                                          |
| `VITE_FIREBASE_API_KEY`             | Yes (via fallback)                        | Firebase API key                                | Frontend Firebase initialization                                                       |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Yes (via fallback)                        | Firebase Auth domain                            | Frontend Firebase initialization                                                       |
| `VITE_FIREBASE_PROJECT_ID`          | Yes (via fallback)                        | Firebase project ID                             | Frontend Firebase initialization                                                       |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Yes (via fallback)                        | Firebase storage bucket                         | Frontend Firebase initialization                                                       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes (via fallback)                        | Firebase messaging sender ID                    | Frontend Firebase initialization                                                       |
| `VITE_FIREBASE_APP_ID`              | Yes (via fallback)                        | Firebase app ID                                 | Frontend Firebase initialization                                                       |
| `VITE_FIREBASE_DATABASE_ID`         | No (defaults to "(default)")              | Firestore database ID                           | Frontend Firebase initialization                                                       |
| `TELEGRAM_BOT_TOKEN`                | No (n8n only)                             | Telegram bot token from @BotFather             | n8n Telegram API credential (see `n8n/README.md`)                                     |
| `N8N_ENCRYPTION_KEY`                | No (n8n profile only)                     | Encryption key for n8n credentials storage      | n8n container (`docker compose --profile n8n up`)                                     |
| `N8N_WEBHOOK_URL`                   | No (n8n profile only)                     | Public HTTPS URL that reaches n8n (ngrok domain)| n8n Telegram webhook registration                                                      |
| `NGROK_AUTHTOKEN`                   | No (n8n profile only)                     | ngrok authtoken (free account)                 | ngrok container (public tunnel for the bot webhook)                                    |
| `NGROK_DOMAIN`                      | No (n8n profile only)                     | ngrok free static domain (e.g. `x.ngrok-free.dev`) | ngrok container                                                                   |
| `VERCEL_TOKEN`                      | No (for CI/CD)                            | Vercel CLI token for deployments                | GitHub Actions (`deploy-preview`, `deploy-production`)                                 |
| `SNYK_TOKEN`                        | No (for CI/CD)                            | Snyk token for security scanning                | GitHub Actions (`security-audit`)                                                      |
| `GITHUB_TOKEN`                      | No (for CI/CD)                            | GitHub token for Docker registry login          | GitHub Actions (`docker-build`)                                                        |

> **Note**: Firebase configuration values have fallbacks defined in `firebase-applet-config.json` and hardcoded defaults in `src/lib/firebase.ts` to ensure out-of-the-box functionality.

## Installation & Local Development

### Prerequisites

- **Node.js**: Version 22.x or later
- **Package Manager**: Bun (recommended) or npm/yarn
- **Firebase Project**: Optional for full functionality (fallback config provides limited demo mode)
- **Gemini API Key**: Optional for receipt scanning (get free key from [Google AI Studio](https://aistudio.google.com/app/apikey))
- **Vercel Account** (optional): For deploying preview/production via GitHub Actions

### Setup Steps

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd expense-planner
   ```

2. **Install Dependencies**

   ```bash
   # Using bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   # Edit .env to add your GEMINI_API_KEY (optional)
   # Firebase configuration uses fallbacks, but you can override via:
   # VITE_FIREBASE_API_KEY=your_key etc.
   # For Vercel deployments via GitHub Actions, set secrets in repo settings
   ```

4. **Start Development Server**

   ```bash
   # Using bun
   bun run dev

   # Or using npm
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

5. **Build for Production**

   ```bash
   # Using bun
   bun run build

   # Or using npm
   npm run build
   ```

   Outputs to `dist/` directory

6. **Start Production Server (Express)**

   ```bash
   # Using bun
   bun run start

   # Or using npm
   npm run start
   ```

   Serves the built application from `dist/server.cjs`

### Firebase Setup (Optional)

For full functionality with your own Firebase project:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password provider)
3. Enable Firestore Database
4. Add your web app to get configuration values
5. Set the following environment variables in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
6. (Optional) Set `VITE_FIREBASE_DATABASE_ID` if using a non-default database

## Database Setup

The application uses Firebase Firestore which requires minimal setup:

### Automatic Initialization

- On first launch, the application creates necessary collections implicitly through writes
- Default categories are provided in code (`DEFAULT_CATEGORIES` in types.ts)
- Households are created automatically when users sign in without an existing membership

### Security Rules

For production use with your own Firebase project, configure Firestore rules to ensure data security. Example rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data or household-scoped data
    match /{document=**} {
      allow read, write: if request.auth != null &&
        (resource.data.user_id == request.auth.uid ||
         resource.data.household_id in get(/databases/$(database)/documents/household_members/$(request.auth.uid)).data.household_id);
    }
  }
}
```

> **Note**: The application includes fallback Firebase configuration for demonstration purposes. For production deployments, it is strongly recommended to use your own Firebase project.

## Testing

The project has a real test suite wired into CI:

```bash
npm test           # Vitest suite (website utils) - 19 tests
npm run bot:validate   # n8n bot suite - 128 logic tests + graph/wiring/code/expression validators
npm run bot:generate   # regenerate the workflow JSON from the generator (drift-checked in CI)
```

### Website unit tests (`tests/`, Vitest)

- `loanUtils.test.ts` — EMI formula (parity with the site's own loans), amortization schedule shape, declining balances, prepayment rows
- `taxUtils.test.ts` — HRA exemption rules (metro/non-metro, rent-10%-basic, PAN threshold), capital-gains engine (Budget-2024 rates + ₹1.25L exemption), breakeven helper

### Bot tests (`n8n/validators/`, plain Node, zero dependencies)

- `test-bot-logic.cjs` — 128 functional tests: command parsing (incl. natural language, `/edit`, `/ask`, callbacks), transaction/goal/loan/recurring builders, budget warnings, HTML escaping, CSV formula-injection guard, invite validation, scan confirmation parking
- `validate-workflow.cjs` — graph structure (orphans, connection refs, `$()` references)
- `check-switch-wiring.cjs` — every switch output wired to the correct target (catches off-by-one routing)
- `check-code-nodes.cjs` — all embedded Code-node scripts parse as valid JS
- `check-expressions.cjs` — every query parameter expression resolves to scalars (n8n's expression parser can't handle nested object literals)

### Testing Approach (beyond the suites)

1. **Manual Verification**: Feature testing through UI interaction
2. **Build Validation**: Ensuring production build succeeds (`npm run build`)
3. **Type Checking**: TypeScript compilation check (`npm run lint` runs `tsc --noEmit`)
4. **Endpoint Testing**: Manual API testing via tools like Postman or curl
5. **CI/CD**: GitHub Actions runs lint, typecheck, tests, security audit on every push/PR

### Recommended Testing Additions

For production readiness, consider adding:

- **Unit Tests**: Using Jest or Vitest for utility functions
- **Integration Tests**: Using supertest for API endpoints
- **End-to-End Tests**: Using Cypress or Playwright for user flows
- **Snapshot Testing**: For React components

## Docker

The application includes production-ready Docker configuration for containerized deployment.

### Multi-Stage Build

The Dockerfile implements a two-stage build process:

```mermaid
flowchart LR
    A[builder Stage] -->|Copies dist/ and node_modules| B[runner Stage]
    A -->|Node:22-alpine| A
    B -->|Node:22-alpine| B
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
```

#### Stage 1: Builder

- **Base**: `node:22-alpine`
- **Actions**:
  - Install all dependencies (including devDependencies)
  - Copy source code
  - Run `npm run build` to generate frontend assets and bundle server
- **Output**: Complete application build in `/app/dist`

#### Stage 2: Runner

- **Base**: `node:22-alpine`
- **Actions**:
  - Install production dependencies only (`--omit=dev`)
  - Copy built assets from builder stage
  - Set environment variables (`NODE_ENV=production`, `PORT=3000`)
  - Expose port 3000
  - Launch `node dist/server.cjs`

### Usage Instructions

#### Quick Start with Docker Compose

```bash
# Web app only
docker compose up --build

# Web app + Telegram bot infrastructure (n8n + ngrok tunnel)
docker compose --profile n8n up -d
```

Access the app at [http://localhost:3000](http://localhost:3000); the n8n editor (bot) at [http://localhost:5678](http://localhost:5678). The bot's full setup (ngrok domain, credentials, workflow import) is documented in [`n8n/README.md`](n8n/README.md).

#### Manual Docker Usage

```bash
# Build image
docker build -t expense-planner .

# Run container
docker run -d \
  -p 3000:3000 \
  --name expense-planner-app \
  -e GEMINI_API_KEY="your-key-here" \
  expense-planner
```

#### Environment Variables in Docker

Pass variables using `-e` flag or `--env-file`:

```bash
docker run -d \
  -p 3000:3000 \
  -e GEMINI_API_KEY="your_key" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  expense-planner
```

### Image Characteristics

- **Size**: Approximately 150-200MB (multi-stage optimization)
- **Layers**: Optimized for caching and rebuild efficiency
- **Security**: Runs as non-root node user (default in node:alpine images)
- **Healthcheck**: Not implemented; consider adding for production orchestration

## Build Process

The build process transforms source code into deployable assets:

```mermaid
flowchart TD
    A[Source Code] --> B[Install Dependencies]
    B --> C[Vite Build: Client Assets]
    B --> D[ESBuild: Server Bundle]
    C --> E[dist/ Directory]
    D --> E
    E --> F[Production Server]
    style A fill:#f9f,stroke:#333,stroke-width:1px
    style B fill:#bbf,stroke:#333,stroke-width:1px
    style C fill:#bfb,stroke:#333,stroke-width:1px
    style D fill:#fbb,stroke:#333,stroke-width:1px
    style E fill:#ff9,stroke:#333,stroke-width:1px
    style F fill:#9f9,stroke:#333,stroke-width:1px
```

### Stages

1. **Dependency Installation**: `npm ci` (or `bun install`)
2. **Frontend Build**: Vite compiles React application to static assets in `dist/`
   - Output: HTML, CSS, JS, assets
   - Features: Minification, code splitting, asset hashing
3. **Server Bundle**: ESBuild bundles `server.ts` into `dist/server.cjs`
   - Format: CommonJS for Node.js compatibility
   - Includes: All server-side dependencies
   - Optimization: Minification and tree-shaking
4. **Production Output**: Complete deployable application in `dist/`

### Build Commands

```bash
# Development build (fast, unoptimized)
npm run dev

# Production build (optimized)
npm run build

# Preview production build locally
npm run preview
```

### Bundle Analysis

The build output includes:

- `dist/index.html`: Application shell
- `dist/assets/`: hashed CSS and JS files
- `dist/server.cjs`: Bundled Express server
- `firebase-applet-config.json`: Firebase configuration copy
-

<a id="ci-cd"></a>

## CI/CD

The application uses GitHub Actions for continuous integration and deployment.

### Workflow Overview (`.github/workflows/ci-cd.yml`)

```mermaid
flowchart TD
    A[Push/PR to main] --> B[Lint & TypeCheck]
    A --> C[Unit Tests]

    B --> D[Build Application]
    C --> D

    D --> E[Security Audit]

    E -->|Pass| F[Deploy Preview - Vercel]
    E -->|Pass| G[Deploy Production - Vercel]
    E -->|Pass| H[Build & Push Docker Image]

    E -->|Fail| I[Notify on Failure]
    F --> J[Deployment Complete]
    G --> J
    H --> J
```

### Jobs

1. **Lint & TypeCheck** (`ubuntu-latest`)
   - Checkout repository
   - Setup Node.js v20
   - Install dependencies (`npm ci`)
   - Run TypeScript check (`npm run lint`)
   - Check formatting (`prettier --check .`)

2. **Unit Tests** (`ubuntu-latest`)
   - Checkout repository
   - Setup Node.js v20
   - Install dependencies (`npm ci`)
   - Run tests (`npm test --if-present`)

3. **Build Application** (`ubuntu-latest`, needs lint/test)
   - Checkout repository
   - Setup Node.js v20
   - Install dependencies (`npm ci`)
   - Build application (`npm run build`)
   - Upload build artifacts (`dist/`)

4. **Security Audit** (`ubuntu-latest`, needs build)
   - Checkout repository
   - Setup Node.js v20
   - Install dependencies (`npm ci`)
   - Run `npm audit --audit-level=high`
   - Run Snyk security scan (optional, continues on error)

5. **Deploy Preview (Vercel)** (`ubuntu-latest`, needs build, if PR)
   - Checkout repository
   - Install Vercel CLI
   - Pull Vercel environment (preview)
   - Build Project Artifacts (`vercel build --prod`)
   - Deploy to Vercel Preview (`vercel deploy --prebuilt`)
   - Comment PR with Preview URL

6. **Deploy Production (Vercel)** (`ubuntu-latest`, needs build, if push to main)
   - Checkout repository
   - Install Vercel CLI
   - Pull Vercel environment (production)
   - Build Project Artifacts (`vercel build --prod`)
   - Deploy to Vercel Production (`vercel deploy --prebuilt --prod`)
   - Notify on success/failure

7. **Build & Push Docker Image** (`ubuntu-latest`, needs build, if push to main)
   - Checkout repository
   - Set up Docker Buildx
   - Log in to Container Registry (ghcr.io)
   - Extract metadata
   - Build and push Docker image (tags: SHA, ref, latest)

8. **Notify on Failure** (`ubuntu-latest`, needs all previous jobs, if failure)
   - Send failure notification (placeholder for Slack/Discord/Email)

### Environment Variables in GitHub Actions

Configure these as repository secrets:

- `VERCEL_TOKEN`: Required for Vercel deployments
- `SNYK_TOKEN`: Optional for Snyk security scanning
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_DATABASE_ID`: Firebase configuration for builds
- `GITHUB_TOKEN`: Automatically provided for Docker registry login

## Deployment

### Vercel Deployment (via GitHub Actions)

1. Push code to GitHub/GitLab/Bitbucket
2. Ensure repository is connected to Vercel (optional; CLI uses token)
3. Add required secrets (`VERCEL_TOKEN`, Firebase vars) in repository settings
4. On push to `main` or pull request, GitHub Actions will:
   - Lint, typecheck, test, build
   - Deploy preview for PRs
   - Deploy production for pushes to `main`
   - Build and push Docker image to GHCR
5. Monitor deployment status in GitHub Actions tab

### Vercel Deployment (Manual)

1. Install Vercel CLI: `npm install -g vercel`
2. Link project: `vercel link` (or use existing)
3. Add environment variables: `vercel env add GEMINI_API_KEY` etc.
4. Deploy: `vercel --prod`

### Docker Deployment

See [Docker](#docker) section for containerized deployment options

### Traditional Node.js Deployment

1. Ensure Node.js 22+ is installed
2. Copy application files to server
3. Run `npm install --omit=dev`
4. Build: `npm run build`
5. Start: `NODE_ENV=production node dist/server.cjs`
6. Configure reverse proxy (NGINX/Apache) for port forwarding and SSL
7. Set environment variables via process env or `.env` file

### Cloud Platforms

- **AWS**: Deploy to EC2, ECS, or Lambda (with adapter)
- **Google Cloud**: Deploy to Cloud Run or App Engine
- **Azure**: Deploy to App Service or Container Instances
- **Netlify**: Possible with serverless functions configuration

### Post-Deployment Checklist

- [ ] Verify `GEMINI_API_KEY` is set for receipt scanning
- [ ] Confirm Firebase connection works (test login and data save)
- [ ] Test receipt scanning functionality with sample image
- [ ] Validate household creation and invitation flow
- [ ] Check responsive design on mobile devices
- [ ] Monitor error logs for any unexpected issues
- [ ] For Vercel: Check function logs in Vercel dashboard
- [ ] For Docker: Check container logs (`docker logs`)

## Security

### Implemented Security Controls

- **Firestore Security Rules** (`firestore.rules`):
  - Per-collection rules with true least-privilege: reads allowed for the owner (`user_id`) or household members; writes owner-only; `system` categories read-only; default-deny for everything else
  - Household membership is verified through a deterministic anchor doc (`household_members/{uid}`) that the app self-heals in `getHhId()` and maintains on join/leave/create; invites live at `invites/{code}` so rules can verify a pending, unexpired invite by path — no more "any signed-in user can read/write the whole database"
  - **Deploy them**: Firebase console → Firestore → select the named database (`ai-studio-59a52c44-...`) → Rules tab → paste `firestore.rules` → Publish (or `firebase deploy --only firestore:rules`)
  - Migration note: users whose only membership is a legacy auto-ID doc regain access automatically if they created their household (self-heal, founder clause); legacy *invite-joined* members need a one-time manual anchor doc or a re-invite
- **Telegram Bot Access Control**:
  - The n8n Telegram Trigger ships with a **user-ID allowlist preset** — only the owner's Telegram account can invoke the bot (change the ID in the trigger node if you fork this)
  - The bot's service account bypasses Firestore rules (Admin-level); all bot credentials live in n8n's encrypted credential store (`N8N_ENCRYPTION_KEY`)
  - The public webhook URL is unguessable (n8n per-workflow path) and carried over HTTPS via ngrok
- **Input Validation**:
  - Server-side validation for all API endpoints: image MIME whitelist (JPEG/PNG/WebP/HEIC/HEIF/GIF), payload size caps, type checks
  - Client-side form validation with HTML5 constraints
  - Bot-side sanity guards: receipt images verified by magic bytes and size; amounts must be positive and under ₹50 lakh; dates beyond ±60 days are re-filed under today with a transparent note
- **Rate Limiting** (Express):
  - Global: 300 requests / 15 min / IP
  - Scan receipt: 20 requests / hour / IP (protects expensive AI operations)
  - Returns 429 with a `Retry-After` header; dependency-free fixed-window implementation
- **Secure Headers** (Express):
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, and a conservative **Content-Security-Policy** on all responses; `nosniff` also set by the serverless scan functions
- **Injection Hardening (Bot)**:
  - All bot replies HTML-escape user-derived text (merchants, notes, category and goal names) before Telegram `parse_mode=HTML` rendering
  - CSV export neutralizes spreadsheet formula injection (cells starting with `=`, `+`, `-`, `@` are prefixed)
- **Authentication**:
  - Firebase Auth with industry-standard password hashing
  - ID token verification for API access (implicit via Firestore rules)
- **Authorization**:
  - Resource ownership enforced through `user_id` and `household_id` scoping (now enforced server-side by rules, not just by convention)
  - Role-based UI elements for household members
  - Bot joins households through the same invite-code flow as human members
- **Data Protection**:
  - Firestore encryption at rest and in transit
  - Environment variable separation for secrets
- **Dependency Management**:
  - Locked versions via package-lock.json and bun.lockb
  - `xlsx` installed from SheetJS's patched CDN build (the npm release is orphaned and vulnerable — see status below)
- **CI/CD Security**:
  - npm audit and Snyk scan in pipeline
  - Secrets managed via GitHub repository secrets

### Recommended Improvements

- **Audit Logging**: Implement structured logging for security-relevant events
- **Password Policies**: Consider enforcing minimum password strength via Firebase Auth settings
- **Session Management**: Implement explicit session expiration on client-side
- **Regular Dependency Updates**: Establish schedule for updating npm/bun packages
- **Client-Side API Key**: The optional client-side Gemini key (LocalStorage) has XSS exposure; prefer the server-side scan path

### Known Security Considerations

- **Firebase Configuration**: The fallback configuration in `firebase-applet-config.json` should not be used for production with sensitive data
- **Rules Deployment Gap**: The hardened rules only protect the database once actually deployed (see the deployment step above); until then the previous permissive rules remain active
- **Bot Service Account**: The n8n bot uses a Google service account with Cloud Datastore User access — it bypasses Firestore rules entirely. Keep the n8n credential store encrypted (`N8N_ENCRYPTION_KEY`) and the Telegram trigger's user-ID allowlist enabled
- **Client-Side API Keys**: Storing Gemini API keys in LocalStorage presents XSS risk; consider using httpOnly cookies if SameSite attributes are properly configured
- **Supply Chain**: Monitor dependencies for vulnerabilities via CI/CD pipeline

### Current Security Status (as of 2026-10-09)

Dependency vulnerability scanning shows **15 vulnerabilities (1 moderate, 14 high), no critical** — down from 31 (including 1 critical) at the start of the hardening pass.

**Resolved**:

- **Critical** `proxy-addr` IP-spoofing (and 14 others) via `npm audit fix`
- **`xlsx` (SheetJS prototype pollution + ReDoS)**: the npm release has no fix; replaced with the patched build from SheetJS's official CDN (`cdn.sheetjs.com/xlsx-0.20.3`) — verified: build and exports work unchanged
- Express had **zero real protections** (no rate limiting, no security headers, no input validation, leaky error messages) — all fixed in `server.ts`; the Vercel and Cloudflare scan functions received the same treatment (MIME whitelist, size cap, generic errors, `nosniff`)
- Firestore went from "any authenticated user can read/write everything" to the least-privilege ruleset in `firestore.rules`

**Accepted / remaining (all transitive, no safe upgrade path)**:

1. `@fastify/busboy`, `undici`, `path-to-regexp`, `ajv` (via `@vercel/node`) — fixes require downgrading `@vercel/node` to 4.0.0, which reintroduces the critical `tar` vulnerability fixed earlier; deliberate risk acceptance
2. `@grpc/grpc-js` (via `firebase`) — fix requires a breaking downgrade of the Firebase SDK
3. `braces` (via `ts-morph`, itself under `@vercel/*`) — no direct update path

**Risk Assessment**: the app builds, typechecks, starts, and passes functional smoke tests with all fixes applied. The remaining 15 are transitive build-tool dependencies not exercised by the runtime app; they are monitored and will be picked up when upstream maintainers publish compatible releases.

## Performance

### Optimizations Implemented

- **Multi-Stage Docker Build**: Minimizes production image size
- **Vite Build Optimization**:
  - Code splitting for route-based chunking
  - Asset hashing for cache busting
  - CSS extraction and minimization
- **ESBuild Server Bundle**: Fast, efficient bundling for Node.js
- **Firestore Caching**:
  - 25-second memory cache for frequent queries
  - 30-second household cache
  - Cache invalidation on writes
- **Image Processing**:
  - HEIC to JPEG conversion reduces file size
  - Client-side resizing for oversized images
- **n8n Bot Workflow**: user-ID allowlist on the trigger; service-account writes are constrained to known collections by the workflow logic
- **Static Asset Caching**: Vercel and Docker deployments leverage browser caching
- **Serverless Functions**: Vercel provides automatic scaling and edge execution

### Performance Metrics

- **Bundle Size**: ~1.2MB gzipped for client assets (varies with dependencies)
- **Server Response Time**: <100ms for cached queries, <500ms for uncached Firestore reads
- **Receipt Scanning**: 2-5 seconds typical for Gemini API calls (network dependent)
- **First Paint**: <1s on moderate connections with warmed cache
- **Cold Start (Vercel)**: <1s for Node.js functions after initial deployment

### Potential Bottlenecks

- **Gemini API Latency**: External API call subject to network and service variability
- **Firestore Read Writes**: Unindexed queries could slow as data grows (mitigated by automatic indexing)
- **Bundle Size**: Large dependencies (firebase, google-genai) impact initial load
- **Concurrent Users**: Horizontal scaling required for high traffic (Vercel handles this automatically)
- **Image Processing**: Large HEIC files may cause temporary memory spikes during conversion
- **Serverless Concurrency**: Vercel function concurrency limits (check Vercel plan)

### Monitoring Recommendations

- Track API response times and error rates
- Monitor Firestore read/write operations and costs
- Measure client-side performance metrics (LCP, FID, CLS)
- Watch Gemini API usage and associated costs
- Observe memory usage in containerized deployments
- Monitor Vercel function invocations and duration
- Set up alerts for failed deployments or pipeline failures

## Error Handling

### Client-Side Error Handling

- **Form Validation**: HTML5 validation with custom error messages
- **API Errors**: Displayed in UI banners (scan status/error sections)
- **Loading States**: Spinners and placeholders during async operations
- **Network Errors**: Catch-all handlers for fetch failures with user-friendly messages
- **Validation Errors**: Field-specific feedback with visual cues

### Server-Side Error Handling (Express)

- **Express Error Handling**: Centralized error logging with specific service identifiers
- **Firestore Operations**:
  - `handleFirestoreError()` logs operation type, path, and auth context
  - Falls back to default data (e.g., DEFAULT_CATEGORIES) on failure
- **AI Service Errors**:
  - Multiple model fallbacks for Gemini API
  - Transient error detection (503, 429) with retry logic
  - User-friendly messages for service availability issues
- **Receipt Scanning**: user-friendly 503 message during high Gemini traffic; retries with model fallback

### Server-Side Error Handling (Vercel Function)

- **Try/Catch**: Wraps main logic to catch synchronous and asynchronous errors
- **Firestore Operations**: Same error handling as Express (if used)
- **AI Service Errors**: Multiple model fallbacks with transient detection
- **Validation**: Returns 400 for missing fields, 500 for internal errors
- **Logging**: Errors logged to console (visible in Vercel logs)

### Error Boundaries

- **React Error Boundaries**: Not implemented; consider adding for production
- **Promise Rejections**: Unhandled rejections logged to console
- **Sync Errors**: Try/catch blocks in async functions with error propagation

### Logging Strategy

- **Console Logging**: Development-focused with timestamps and context
- **Error Levels**:
  - `console.error()` for failures
  - `console.warn()` for recoverable issues
  - `console.info()` for operational notices
- **Production Considerations**:
  - Implement structured logging (JSON format)
  - Add log levels and categorization
  - Consider external logging service integration

### User-Friendly Error Messages

- **Receipt Scanning**:
  - - Express: `"Receipt scan limit exceeded. Try again in an hour."` (rate limit)
  - - Express/Vercel: `"The receipt scanning AI service is temporarily experiencing high traffic."` (503)
  - - Generic: `"Failed to process receipt with AI model"`
- **Authentication**: Firebase-provided messages (customizable via Firebase console)
- **Validation**: HTML5 validation messages with custom styling
- **Network**: `"Failed to connect to server. Please check your connection."`
- **Permissions**: `"You don't have permission to perform this action."`

## Troubleshooting

### Common Issues and Solutions

#### Problem: Application fails to start

**Symptoms**:

- Blank screen or loading spinner that never disappears
- Console errors about missing modules or failed imports

**Diagnosis**:

1. Check Node.js version (requires 22+)
2. Verify `bun install` or `npm install` completed successfully
3. Confirm `.env` file exists and contains required variables
4. Check browser console for specific error messages

**Solution**:

```bash
# Reinstall dependencies
bun install

# Verify Node version
node --version

# Clear cache and reinstall
rm -rf node_modules bun.lockb package-lock.json
bun install
```

#### Problem: Receipt scanning not working

**Symptoms**:

- Scan button does nothing or shows perpetual loading
- Error messages about API key or service unavailability

**Diagnosis**:

1. Check if `GEMINI_API_KEY` is set in environment (for backend/Vercel) or LocalStorage (for frontend)
2. Verify network connectivity to `generativelanguage.googleapis.com`
3. Check server logs (Express) or Vercel function logs for specific error messages
4. Confirm image format is supported (JPG, PNG, HEIC)

**Solution**:

```bash
# For backend scanning
export GEMINI_API_KEY="your_actual_key"

# For Vercel via GitHub Actions
# Ensure VERCEL_TOKEN and GEMINI_API_KEY are set as repo secrets

# For frontend fallback (via UI)
# Click the Key button in Expense section and enter API key

# Test connectivity
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY"
```

#### Problem: Firebase connection errors

**Symptoms**:

- Authentication fails or loops
- Data not saving or loading
- Console errors about Firebase initialization

**Diagnosis**:

1. Verify Firebase configuration in `.env` or fallback configuration
2. Check Firestore database is enabled in Firebase console
3. Confirm Authentication providers (Email/Password) are enabled
4. Look for specific Firebase error codes in console

**Solution**:

```bash
# Check Firebase initialization
# Ensure these are set (or fallbacks are working):
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID

# Test Firebase connectivity manually
# Use Firebase CLI or SDK to verify project access
```

#### Problem: Docker container fails to start

**Symptoms**:

- Container exits immediately
- Logs show "Cannot find module" or "Address already in use"

**Diagnosis**:

1. Check ports: Ensure 3000 is available on host
2. Verify image built successfully: `docker images`
3. Check environment variables passed to container
4. Examine container logs: `docker logs expense-planner-app`

**Solution**:

```bash
# Check port availability
lsof -i :3000

# Rebuild with cache cleared
docker compose build --no-cache

# Run with port mapping check
docker run -p 3001:3000 ...  # Try different host port

# Inspect container filesystem
docker run --rm -it expense-planner sh
```

#### Problem: Vercel function fails

**Symptoms**:

- Deployment succeeds but function returns 500
- Logs show missing modules or timeouts

**Diagnosis**:

1. Check Vercel function logs in dashboard
2. Verify `GEMINI_API_KEY` is set in environment variables
3. Ensure `api/scan-receipt.ts` is included in build (vercel.json`
4. Check bundle size and dependencies

**Solution**:

```bash
# Add missing env var in Vercel dashboard
# Redeploy after fixing
# Verify build output includes api/scan-receipt.ts
```

#### Problem: Telegram bot not responding or entries missing from the website

**Symptoms**:

- Bot goes silent after working before
- Bot entries don't appear on the website dashboard
- Receipt scans return wrong data

**Diagnosis & Solution**:

1. Bot silent → check `docker compose --profile n8n ps` (n8n + ngrok must both be Up), then n8n → Executions tab for errors — every bot reply carries a self-diagnosing "Reason:" line when something fails
2. Bot entries missing on the website → confirm the bot is linked to your household (`/join` once, using an invite code from the Family tab); unlinked entries are invisible to the household-scoped dashboard
3. Empty lists everywhere on the website → the household-scoped queries need composite Firestore indexes — see "Required Firestore composite indexes" in [`n8n/README.md`](n8n/README.md) (missing indexes fail silently as empty results)
4. Receipt scans wrong → the bot scans with `gemini-2.5-pro` at temperature 0; if the "Reason:" line shows a rate limit, wait ~1 minute (free-tier quota) and resend

Full bot troubleshooting table: [`n8n/README.md`](n8n/README.md).

#### Problem: Household features not working

**Symptoms**:

- Unable to create or join household
- Missing household data in UI
- Role-based features not functioning

**Diagnosis**:

1. Check Firebase console for `households` and `household_members` collections
2. Verify user is properly authenticated
3. Look for errors in household-related functions in console
4. Confirm `createdBy` and `joinedAt` fields are present

**Solution**:

```bash
# Force household refresh
# In AuthContext, the refreshHousehold function can be called
# Try signing out and back in

# Check Firestore rules if using custom project
# Ensure reads/writes to household collections are allowed
```

## Extending the Application

### Adding a New Financial Section

1. **Create Component**: `src/components/NewSection.tsx`
2. **Add Route**: Update `src/App.tsx` (if using route-based) or `src/pages/Dashboard.tsx` tab list
3. **Add Library Functions**: Extend `src/lib/db.ts` with new CRUD operations
4. **Add Types**: Update `src/types.ts` with new interfaces
5. **Add Icons**: Import from lucide-react in component
6. **Add to Dashboard**: Add to `tabs` array in Dashboard.tsx with appropriate visibility rules

### Adding a New API Endpoint

1. **Define Route**:
   - For Express: Add to `server.ts` with appropriate method and path
   - For Vercel: Add new file in `api/` directory (e.g., `api/new-endpoint.ts`)
2. **Add Middleware**: Apply rate limiting or authentication as needed
3. **Implement Logic**:
   - Validate input
   - Interact with Firestore via `lib/db.ts` functions
   - Return appropriate JSON responses
4. **Add Error Handling**: Try/catch with user-friendly error messages
5. **Test**: Verify with curl or Postman (Express) or `vercel dev` (Vercel)

### Adding a New Firestore Collection

1. **Define Interface**: Add to `src/types.ts`
2. **Add CRUD Functions**: Implement in `src/lib/db.ts` following existing patterns
3. **Add Hooks**: Consider creating custom React hooks for data fetching
4. **Update Caching**: Add to caching mechanism if frequent access needed
5. **Test**: Verify read/write operations work correctly

### Adding a New Bot Command

1. **Parse it**: Add a regex + intent branch in the `Classify Update` node of `n8n/expense-planner-bot.json` (or paste-update `n8n/classify-update.js` if hot-fixing)
2. **Route it**: Add a rule + output on the `Route by Intent` switch and wire it to a branch
3. **Household-scoped data?** Route through the `Query Household (Hub)` → `Dispatch After Household` pattern; use the `$1`/`$2` scoped-query trick (field itself parameterized)
4. **Writes**: mirror the website's exact field types — dates as strings via the REST writers (`n8n`'s Firestore node silently converts date-like strings to timestamps, which the website's string-range queries can't see)
5. **Re-export** the workflow JSON from the n8n editor back into `n8n/expense-planner-bot.json` to keep the repo in sync

**Website-parity checklist before shipping a bot command:** same collection, same
field names, `date`/`month` as plain strings, `household_id` attached when the
user is linked, and composite indexes exist for any new household-scoped query
shape (missing indexes fail silently as empty lists — see `n8n/README.md`).

### Adding Third-Party Integrations

1. **Authentication Providers**:
   - Enable in Firebase console
   - Add to login page options
2. **Payment Gateways**:
   - Create backend endpoint for payment processing
   - Store transaction references in Firestore
   - Update UI with payment status
3. **Data Export Formats**:
   - Extend export functionality in `src/lib/exportUtils.ts`
   - Add new format options to ExportModal
4. **Analytics Services**:
   - Initialize in `src/main.tsx` or via context
   - Track key events and user flows

### Customization Points

- **Theming**: Modify Tailwind CSS configuration in `vite.config.ts` or use CSS variables
- **Default Categories**: Edit `DEFAULT_CATEGORIES` array in `src/types.ts`
- **Payment Modes**: Update `payment_mode` union type in `src/types.ts` and UI selects
- **Frequency Options**: Modify `RecurringRule.frequency` type and related processing
- **Date Formats**: Adjust display formatting in utility functions (none currently centralized)

## Architectural Decisions

### Decision: Firebase Firestore as Primary Database

- **Evidence**:
  - Firebase imports throughout `src/lib/` directory
  - Firestore-specific queries in `db.ts` and `db_household.ts`
  - No SQL or alternative database references
- **Impact**:
  - Enables real-time updates and offline persistence
  - Scales automatically with usage
  - Provides built-in authentication integration
- **Trade-offs**:
  - Less control over data modeling compared to SQL
  - Potential cost at scale
  - Vendor lock-in to Google Cloud Platform
- **Justification**:
  - Chosen for rapid development and seamless auth integration
  - Well-suited for the hierarchical, sparse data patterns of financial tracking
  - Enables cross-platform consistency (web, future mobile)

### Decision: Context-Based State Management

- **Evidence**:
  - `AuthContext.tsx` and `ThemeContext.tsx` in `src/contexts/`
  - Usage of `useAuth()` and `useTheme()` hooks throughout components
  - No external state management libraries (Redux, Zustand, etc.) in dependencies
- **Impact**:
  - Centralizes global state (auth, theme) without prop drilling
  - Reduces bundle size by avoiding additional libraries
  - Simplifies state updates with familiar React patterns
- **Trade-offs**:
  - Can lead to excessive re-renders if not optimized
  - Less powerful than full state management libraries for complex state
  - Requires careful separation of concerns
- **Justification**:
  - Sufficient for application's state complexity
  - Leverages React's built-in capabilities
  - Maintains lightweight dependency footprint

### Decision: Multi-Modal Receipt Scanning Approach

- **Evidence**:
  - Dual-path approach in `src/lib/receiptScanner.ts` (client/server fallback)
  - Multiple Gemini model fallbacks in both client and server implementations
  - Telegram bot runs receipt scans through its own pipeline with sanity guards and a user-ID allowlist
  - Vercel serverless function (`api/scan-receipt.ts`) for serverless environments
- **Impact**:
  - Ensures functionality across deployment types (serverful, static, serverless)
  - Provides resilience against service outages
  - Controls costs through a single flash-model first pass with a pro-model fallback only on failure
- **Trade-offs**:
  - Increased code complexity
  - Potential inconsistency between client and server results
  - Requires maintaining two implementation paths
- **Justification**:
  - Maximizes deployment flexibility (Vercel, Docker, static hosts)
  - Addresses varying security and performance requirements
  - Provides graceful degradation when AI service is unavailable

### Decision: Modular Financial Section Architecture

- **Evidence**:
  - Consistent section structure in `src/pages/Dashboard.tsx`
  - Similar patterns across `ExpenseSection`, `IncomeSection`, etc.
  - Shared utility libraries (`lib/` directory)
  - Type-safe interfaces in `types.ts`
- **Impact**:
  - Enables parallel development of features
  - Provides consistent user experience across sections
  - Simplifies maintenance through predictable patterns
  - Facilitates testing and documentation
- **Trade-offs**:
  - May lead to boilerplate code in similar sections
  - Could benefit from higher-order abstractions for common patterns
  - Section coupling through shared state (AuthContext, etc.)
- **Justification**:
  - Balances consistency with flexibility for section-specific needs
  - Scales well to additional financial domains
  - Makes the codebase approachable for new contributors

### Decision: GitHub Actions Pipeline

- **Evidence**:
  - `.github/workflows/ci-cd.yml` defines lint, test, build, security audit, deploy
  - Docker build/push to GHCR
  - Vercel preview/production deployments
- **Impact**:
  - Automated testing and deployment
  - Early detection of regressions and vulnerabilities
  - Consistent delivery to multiple platforms
- **Trade-offs**:
  - Increased complexity of workflow maintenance
  - Dependency on external services (Vercel, Docker registry)
  - Potential for long build times
- **Justification**:
  - Enables rapid iteration with confidence
  - Provides visibility into deployment process
  - Supports both serverful and serverless deployment targets

## FAQ

### How do I start the development server?

Run `bun run dev` or `npm run dev` from the project root. The application will be available at [http://localhost:3000](http://localhost:3000).

### Do I need a Google Gemini API key?

The key is optional but highly recommended for the receipt scanning feature. Without it, users must enter transactions manually. Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Can I use this application without Firebase?

The application requires Firebase for authentication and data storage. However, it includes fallback configuration that uses a demo Firebase project for initial exploration.

### How do I invite family members to join my household?

1. Click on your role badge in the header (next to your email)
2. Select "Invite Family Member" (if implemented) or go to Household section
3. Enter the email address and select role (spouse/dependent)
4. Share the generated invite code with the family member
5. They can accept the invite via the app or by entering the code in the Household section
6. **To link the Telegram bot too**: send `/join <invite code>` to the bot — after that, everything logged via Telegram shows up in your household dashboard

### Where is my data stored?

Data is stored in Firebase Firestore, a NoSQL cloud database. The Telegram bot reads and writes the exact same Firestore collections (with a Google service account), so there is one source of truth for both the website and the bot. If using the fallback configuration, data is stored in a demo project. For production use, configure your own Firebase project.

### How secure is my financial data?

The application implements:

- Firebase Authentication with secure password handling
- Least-privilege Firestore security rules (see `firestore.rules`)
- Rate limiting and security headers on the API server
- n8n trigger user-ID allowlist on the Telegram bot
- Environment variable separation for secrets
- No sensitive data stored client-side beyond session tokens
  For maximum security, use your own Firebase project and deploy the rules from `firestore.rules`.

### Can I run this application offline?

Yes, to a limited extent. Firestore provides offline persistence that allows viewing and editing data while offline. Changes sync automatically when connectivity is restored. Some features like receipt scanning require internet connectivity.

### How do I update the application?

Pull the latest changes from the repository and restart the development server or rebuild for production:

```bash
git pull
bun install   # or npm install
bun run dev   # for development
# or
bun run build && bun run start  # for production
```

### How is the application deployed?

The application can be deployed via:

- **Vercel**: Using GitHub Actions (`vercel deploy --prebuilt`) or Vercel CLI
- **Docker**: Using `docker compose up --build` or manual `docker run`
- **Traditional Node.js**: Using `npm run build` then `node dist/server.cjs`
- **Cloudflare Pages**: Static frontend + `functions/api/*` for receipt scanning

The **Telegram bot** runs separately as a self-hosted n8n instance
(`docker compose --profile n8n up -d` — see [`n8n/README.md`](n8n/README.md))
and connects to the same Firestore database, so it works with any of the above.
  The pipeline automates Vercel and Docker builds/pushes on pushes to `main`.

### Is the application suitable for business use?

The application is designed for personal and family finance management. While it could be adapted for small business use, it lacks features like invoicing, payroll, inventory management, and complex accounting required for business operations.

## Contributing

We welcome contributions to improve Expense Planner! Please follow these guidelines:

### Development Guidelines

- **Code Style**: Follow existing TypeScript and React patterns in the codebase
- **Component Design**:
  - Create reusable components in `src/components/`
  - Use Tailwind CSS for styling
  - Follow props destructuring and default value patterns
- **State Management**:
  - Use React Context for global state (auth, theme)
  - Use local state for component-specific data
  - Avoid prop lifting when possible
- **API Design**:
  - Follow RESTful conventions
  - Use appropriate HTTP status codes
  - Validate all inputs
  - Handle errors gracefully
- **Database Design**:
  - Follow existing Firestore patterns
  - Add appropriate indexes for queries
  - Consider data duplication for read performance
  - Use transactions for related writes when needed
- **Testing**:
  - Add unit tests for new utility functions
  - Consider integration tests for new features
  - Update documentation for user-facing changes

### Pull Request Process

1. Ensure your code passes `npm run lint` (tsc --noEmit)
2. Verify your changes work in both development and production builds
3. Update the README if necessary for new features
4. Keep PRs focused on a single feature or fix
5. Respond to reviewer comments promptly
6. Maintain a clean, linear commit history

### Reporting Issues

Please use the GitHub Issues tracker to report bugs or suggest features. Include:

- Clear description of the issue
- Steps to reproduce (if applicable)
- Expected vs actual behavior
- Screenshots or console logs (if helpful)
- Environment details (browser, Node version, etc.)
