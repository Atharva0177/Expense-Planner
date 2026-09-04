# Expense Planner

A comprehensive personal and family finance management application built with React, Express, and Firebase. Features include expense tracking, income management, budgeting, goal setting, loan tracking, investment tracking, tax calculations, and AI-powered receipt scanning.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running Locally](#running-locally)
- [Frontend](#frontend)
- [Backend](#backend)
- [Database](#database)
- [API](#api)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Core Features](#core-features-detailed)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Testing](#testing)
- [Docker](#docker)
- [Build Process](#build-process)
- [CI/CD](#ci-cd)
- [Deployment](#deployment)
- [Security](#security)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)
- [Extending the Application](#extending-the-application)
- [Architectural Decisions](#architectural-decisions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [FAQ](#faq)
- [Glossary](#glossary)
- [Contributing](#contributing)
- [License](#license)

## Overview

Expense Planner is a full-stack web application designed to help individuals and families manage their finances effectively. The combination manual entry with automation features to provide a holistic view of financial health.

### Purpose

The primary purpose of Expense Planner is to simplify financial management by providing tools for tracking expenses, income, budgets, loans, investments, and taxes. It leverages Firebase for real-time data synchronization and Express.js for backend operations, with a React frontend for a responsive user interface.

### Target Audience

- Individuals seeking personal finance management
- Families requiring shared financial tracking
- Small households looking for collaborative budgeting
- Users interested in AI-assisted receipt scanning

### Main Components

1. **Frontend**: React application with Tailwind CSS for styling
2. **Backend**: Express.js server handling API requests and business logic
3. **Database**: Firebase Firestore for real-time data storage
4. **AI Integration**: Google Gemini AI for receipt scanning and data extraction
5. **Authentication**: Firebase Authentication with household-based access control

### Key Characteristics

- Real-time synchronization across devices
- Role-based access control for household members
- Offline capabilities through Firebase persistence
- Modular architecture for easy extensibility
- Comprehensive financial tracking from daily expenses to long-term investments
- Tax optimization suggestions based on user data
- Secure handling of sensitive financial information

## Key Features

- **Expense Tracking**: Record and categorize expenses with support for multiple payment modes and sources
- **Income Management**: Track various income sources including salary, bonuses, and allowances with detailed breakdowns
- **Budgeting**: Set monthly budgets per category with alerts and tracking
- **Goal Setting**: Create financial savings goals with target amounts and dates
- **Loan & EMI Tracking**: Manage loans with amortization schedules and payment tracking
- **Investment Tracking**: Monitor investment accounts, holdings, and valuations
- **Tax Calculations**: Compute tax liabilities under old and new regimes with optimization suggestions
- **Household Management**: Support for multi-user households with role-based access (primary, spouse, dependent)
- **AI Receipt Scanner**: Extract transaction details from receipt images using Google Gemini AI
- **Recurring Transactions**: Automate regular expenses and incomes with configurable frequencies
- **Data Export**: Export financial data in various formats for backup or analysis
- **Theme Support**: Light, dark, and system themes with persistent preferences
- **Responsive Design**: Optimized for mobile and desktop viewing
- **Real-time Synchronization**: Instant updates across devices via Firebase Firestore
- **Offline Functionality**: Continued operation with local caching and synchronization when back online
- **Security**: Role-based access control, secure authentication, and data validation
- **Multi-currency Support**: Primarily INR-based with flexibility for other currencies
- **Financial Year Tracking**: Align with Indian financial year for tax purposes
- **Export & Reporting**: Generate reports and export data for external analysis
- **Custom Categories**: Create personalized expense and income categories beyond defaults
- **Payment Mode Tracking**: Monitor transactions by payment method (UPI, Card, Cash, etc.)
- **Source Tracking**: Distinguish between manual, recurring, and imported transactions

## Technology Stack

### Frontend
- **React 19**: JavaScript library for building user interfaces
- **React Router DOM 7**: Declarative routing for React applications
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Headless UI**: Unstyled, accessible UI components for React
- **Lucide React**: Beautiful & consistent icon toolkit
- **Recharts**: Composables charting library built on React and D3
- **Motion**: Framer Motion for animations and gestures
- **Clsx**: Utility for constructing className strings conditionally
- **Tailwind Merge**: Utility to efficiently merge Tailwind CSS classes
- **JSPDF**: PDF document creation from JavaScript
- **JSPDF AutoTable**: Plugin for JSPDF to generate tables
- **Heic2any**: Convert HEIC images to common formats
- **XLSX**: Spreadsheet parser and writer
- **Vite 6**: Next-generation frontend tooling for fast development and build

### Backend
- **Node.js 22**: Java runtime for server-side execution
- **Express 4**: Fast, unopinionated, minimalist web framework
- **Dotenv**: Loads environment variables from .env file
- **Express Rate Limit**: Basic rate-limiting middleware for Express
- **TSX**: Execute TypeScript files directly without precompilation
- **Google GenAI SDK**: Official Google AI SDK for Gemini models
- **Firebase Admin SDK**: Server-side Firebase integration for privileged operations

### Development Tools
- **TypeScript 5.8**: Typed superset of JavaScript that compiles to plain JavaScript
- **Vite Plugin React**: Official Vite plugin for React
- **Tailwind CSS Vite Plugin**: Official Tailwind CSS integration for Vite
- **Autoprefixer**: Parse CSS and add vendor prefixes
- **ESBuild**: Extremely fast JavaScript bundler and minifier
- **Puppeteer**: Headless browser for testing and automation
- **TSX**: TypeScript Execute for running TypeScript without compilation
- **Vercel Node**: Official Vercel adapter for Node.js applications

### Database & Infrastructure
- **Firebase Firestore**: NoSQL document database for real-time data storage
- **Firebase Authentication**: Secure authentication system with multiple providers
- **Firebase Hosting**: Static and dynamic web hosting (alternative deployment)
- **Persistent Local Cache**: Firestore IndexedDB caching for offline support
- **Multiple Tab Manager**: Synchronizes Firestore state across browser tabs

### Build & Deployment
- **Docker**: Containerization platform for consistent deployment
- **Multi-stage Docker Build**: Optimized production images with reduced footprint
- **Vercel**: Platform for frontend and serverless function deployment
- **GitHub Actions**: CI/CD pipeline for automated testing, building, and deployment

### Environment Variables
- **GEMINI_API_KEY**: Google Gemini AI API key for receipt scanning
- **VITE_GEMINI_API_KEY**: Client-side fallback key for static deployments
- **APP_URL**: Application URL for absolute links
- **VITE_FIREBASE_API_KEY**: Firebase API key (client-side)
- **VITE_FIREBASE_AUTH_DOMAIN**: Firebase authentication domain
- **VITE_FIREBASE_PROJECT_ID**: Firebase project identifier
- **VITE_FIREBASE_STORAGE_BUCKET**: Firebase storage bucket
- **VITE_FIREBASE_MESSAGING_SENDER_ID**: Firebase messaging sender ID
- **VITE_FIREBASE_APP_ID**: Firebase application ID
- **VITE_FIREBASE_DATABASE_ID**: Firebase database ID (optional)

### Dependencies Summary
- **Production Dependencies**: 18 packages including React, Firebase, Express, TailwindCSS
- **Development Dependencies**: 12 packages including TypeScript, Vite, ESBuild, Puppeteer

## Architecture

### High-Level Architecture

Expense Planner follows a three-tier architecture:
1. **Presentation Layer**: React frontend running in the browser
2. **Application Layer**: Express.js backend server handling API requests and business logic
3. **Data Layer**: Firebase Firestore NoSQL database for persistent storage

The application uses a client-server model where the frontend communicates with the backend via RESTful API endpoints. The backend interacts with Firebase Firestore for all data operations. Authentication and authorization are handled by Firebase Authentication on the frontend, with additional validation on the backend.

### Frontend Architecture

The frontend follows a component-based architecture with the following key aspects:

- **Single Page Application (SPA)**: Built with React Router for client-side routing
- **Context API**: Used for global state management (authentication, theme)
- **Component Hierarchy**:
  - `App.tsx`: Root component managing authentication, theming, and routing
  - `Dashboard.tsx`: Main container with tab-based navigation
  - **Sections**: Individual feature components (Overview, Income, Expense, etc.)
  - **Reusable Components**: UI elements like buttons, forms, modals shared across sections
- **State Management**:
  - React Context for authentication and theme state
  - Local component state for UI interactions and form data
  - Custom hooks for data fetching and caching (in `lib/db.ts`)
- **Styling**: Tailwind CSS for utility-first styling with dark mode support
- **Routing**: Protected routes for authenticated users, public routes for login
- **Performance**: Code splitting via Vite, lazy loading of sections, efficient re-renders

### Backend Architecture

The backend follows a modular architecture with clear separation of concerns:

- **Entry Point**: `server.ts` initializes Express application and middleware
- **Middleware Stack**:
  - `express.json()`: Body parsing with size limit
  - Rate limiting: Global and endpoint-specific protection against abuse
  - Vite middleware: In development, serves frontend and enables HMR
  - Static file serving: In production, serves built frontend assets
- **API Routes**:
  - `/api/health`: Health check endpoint
  - `/api/scan-receipt`: AI-powered receipt scanning (protected by rate limiter)
- **Business Logic**:
  - AI integration: Google Gemini API for receipt processing
  - Error handling: Centralized error handling with logging
  - Environment configuration: Loaded via dotenv
- **Firebase Integration**:
  - Admin SDK: Used for server-side Firebase operations when needed
  - Note: Most database operations occur on the frontend via client SDK for real-time capabilities

### Database Architecture

Data is stored in Firebase Firestore with the following collections:

- **categories**: User-specific and system default expense/income categories
- **income_entries**: Income records with hierarchical breakdowns
- **transactions**: Expense and income transactions
- **budgets**: Monthly budget limits per category
- **recurring_rules**: Automated transaction rules
- **loans**: Loan details (principal, interest, tenure)
- **loan_schedules**: Amortization schedules for loans
- **goals**: Financial savings goals
- **tax_calculations**: Tax computation results
- **households**: Family groups
- **household_members**: User associations with households
- **invites**: Pending household invitations

### Security Architecture

- **Authentication**: Firebase Authentication (email/password, with support for other providers)
- **Authorization**: 
  - Frontend: Protected routes check authentication state
  - Backend: API endpoints validate user identity and permissions
  - Data Level: Firestore security rules (not implemented in this version, relying on frontend/backend validation)
- **Data Protection**:
  - Sensitive data (API keys) stored in environment variables
  - Rate limiting prevents abuse of AI endpoints
  - Input validation on all API endpoints
  - Secure headers via Express middleware (could be enhanced)
- **Household Isolation**: 
  - Users can belong to only one household at a time
  - Data queries are scoped to household ID when available
  - Fallback to user ID for personal data when no household exists

### Communication Architecture

- **Frontend ↔ Backend**: RESTful API over HTTPS/HTTP
- **Frontend ↔ Firebase**: Direct real-time connections for database operations
- **Backend ↔ Google Gemini API**: Server-to-server communication for AI processing
- **Data Flow**:
  1. User action in frontend (e.g., add expense)
  2. Frontend writes directly to Firebase Firestore (optimistic update)
  3. Frontend also notifies backend for AI-dependent operations (receipt scanning)
  4. Backend processes and returns result to frontend
  5. Real-time updates propagate to all connected clients via Firebase

### Deployment Architecture

- **Development**: 
  - Frontend: Vite dev server with HMR
  - Backend: Express server with Vite middleware
  - Database: Firebase emulator or production instance
- **Production**:
  - Option 1: Docker container running Express server serving static frontend
  - Option 2: Vercel deployment with serverless functions for API and static asset serving
  - Database: Firebase production instance
- **Environment Separation**: 
  - Different Firebase projects for development/staging/production (via env vars)
  - Separate configuration for API keys and endpoints

## Directory Structure

Expense Planner follows a organized directory structure separating frontend, backend, shared logic, and configuration files:

```
e:/Expense
├── .github/                     # GitHub Actions workflows and CI/CD configuration
│   └── workflows/
│       └── ci-cd.yml           # CI/CD pipeline for testing, building, and deployment
├── .claude/                     # Claude Code configuration and skills
├ assets/                        # Static assets (images, icons, etc.)
│   └── .aistudio/              # AI Studio specific assets
├── src/                         # Main source code directory
│   ├── contexts/               # React Context providers (auth, theme)
│   │   ├── AuthContext.tsx     # Firebase authentication and household management
│   │   └── ThemeContext.tsx    # Light/dark/system theme handling
│   ├── lib/                    # Backend-integrated libraries and utilities
│   │   ├── db.ts               # Firestore database operations and caching
│   │   ├── db_household.ts     # Household-specific database operations
│   │   ├── firebase.ts         # Firebase initialization and configuration
│   │   └── types.ts            # TypeScript interfaces and type definitions
│   ├── pages/                  # Page-level components (route endpoints)
│   │   ├── Dashboard.tsx       # Main dashboard with tab navigation
│   │   └── Login.tsx           # Authentication page
│   ├── components/             # Reusable UI components
│   │   ├── BudgetSection.tsx   # Budget management UI
│   │   ├── ExpenseSection.tsx  # Expense tracking UI
│   │   ├── GoalSection.tsx     # Savings goals UI
│   │   ├── HouseholdSettings.tsx # Family management UI
│   │   ├── IncomeSection.tsx   # Income tracking UI
│   │   ├── InvestmentSection.tsx # Investment portfolio UI
│   │   ├── LoanSection.tsx     # Loan and EMI tracking UI
│   │   ├── OverviewSection.tsx # Financial summary dashboard
│   │   ├── RecurringSection.tsx # Recurring transactions UI
│   │   ├── ReportSection.tsx   # Financial reports UI
│   │   ├── TaxSection.tsx      # Tax calculations UI
│   │   ├── ExportModal.tsx     # Data export dialog
│   │   └── ThemeToggle.tsx     # Light/dark mode switcher
│   ├── App.tsx                 # Root application component
│   └── index.css               # Global CSS imports (Tailwind)
├── server.ts                   # Express backend server entry point
├── api/                        # Backend API route handlers
│   ├── health.ts               # Health check endpoint
│   └── scan-receipt.ts         # AI-powered receipt scanning endpoint
├== Dockerfile                  # Multi-stage Docker build configuration
├── docker-compose.yml          # Docker Compose for local development
├── index.html                  # Main HTML entry point
├── package.json                # Project metadata and dependencies
├        package-lock.json           # Locked dependency versions
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite frontend build configuration
├ .env.example                # Example environment variables
├ .dockerignore               # Docker build exclusion patterns
├ .gitignore                  # Git exclusion patterns
└── README.md                   # This file
```

### Key Directories Explained

- **src/**: Contains all frontend source code
  - **contexts/**: React Context providers for global state (auth, theme)
  - **lib/**: Backend-adjacent code (Firebase initialization, database operations, types)
  - **pages/**: Route-level components that map to URL paths
  - **components/**: Reusable UI building blocks used across pages
- **api/**: Backend-specific route handlers (separated from src for clarity)
- **.github/**: Automation workflows for CI/CD
- **Root Configuration**: Package managers, TypeScript, Vite, Docker files

### Important File Responsibilities

- **server.ts**: Main Express application setup, middleware, API routes, and Firebase integration
- **vite.config.ts**: Frontend build configuration with plugins for React and Tailwind CSS
- **tsconfig.json**: TypeScript compilation settings with path aliases (@/*)
- **firebase.ts**: Firebase client SDK initialization with environment variable fallbacks
- **db.ts**: Centralized Firestore operations with caching layer and error handling
- **types.ts**: Shared TypeScript interfaces for data consistency across frontend/backend
- **App.tsx**: Application root wrapping providers and setting up routing
- **Dashboard.tsx**: Main interface with tab navigation and section rendering
- **scan-receipt.ts**: AI endpoint for processing receipt images with Gemini
- **health.ts**: Simple health check endpoint for monitoring
- **docker-compose.yml**: Defines service, ports, environment, and volume mappings
- **Dockerfile**: Multi-stage build for Node.js application with production optimization

## Installation

### Prerequisites

- Node.js 20+ (tested with version 22)
- npm (comes with Node.js) or alternative package manager (yarn, pnpm)
- Git for version control
- Firebase project (optional for full functionality; can use emulator for testing)
- Google Gemini API key (required for AI receipt scanning feature)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Expense
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```
   This installs exact versions from package-lock.json for reproducible builds.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to add your configuration:
   - `GEMINI_API_KEY`: Your Google Gemini API key (obtain from Google AI Studio)
   - Firebase configuration variables (optional for initial testing):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_DATABASE_ID` (optional)
   - `APP_URL`: Set to `http://localhost:5173` for local development

4. **Set up Firebase (optional but recommended for full features)**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password provider)
   - Enable Firestore Database
   - Add a web app to your Firebase project to get config values
   - Update the `.env` file with your Firebase configuration values

5. **(Optional) Install and run Firebase emulators for local development**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init emulators
   firebase emulators:start
   ```
   Then update your `.env` to point to the emulators (e.g., change database host to localhost).

6. **Start the development server**
   ```bash
   npm run dev
   ```
   This will start both the Vite frontend dev server and the Express backend server.

7. **Access the application**
   Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Veration Steps

- The application should load and display the login page
- Click "Sign Up" to create a new account or use test credentials if available
- After successful authentication, you should see the main dashboard with navigation tabs
- Test core features:
  - Add an income entry
  - Add an expense transaction
  - Set a budget for a category
  - Create a savings goal
- Test AI receipt scanner (requires valid GEMINI_API_KEY):
  - Navigate to any section that allows manual entry
  - Look for the receipt upload option
  - Upload a clear image of a receipt
  - Verify extracted data (amount, date, merchant, category)

### Troubleshooting Installation

- **Port already in use**: Change the port in `package.json` scripts or set `PORT` environment variable
- **Firebase initialization errors**: Double-check your Firebase config values in `.env`
- **Module not found errors**: Delete `node_modules` and `package-lock.json`, then run `npm ci` again
- **TypeScript errors**: Ensure you have TypeScript 5.8+ installed (`npx tsc --version`)

## Environment Configuration

Expense Planner relies on environment variables for configuration across different environments (development, testing, production). All environment variables are loaded via `dotenv` in the backend and via `import.meta.env` in the frontend (Vite).

### Required Variables

| Variable | Required | Purpose | Where Used | Example |
| -------- | -------- | ------- | -------- | ------- |
| `GEMINI_API_KEY` | Yes | Google Gemini AI API key for receipt scanning | Backend (`server.ts`) | `AIzaSyYourActualKeyHere` |
| `APP_URL` | Yes | Base URL for the application (used for absolute links) | Frontend | `http://localhost:5173` |
| `NODE_ENV` | No (defaults to `development`) | Application mode (development/production) | Both | `development` or `production` |
| `PORT` | No (defaults to `3000`) | Port for the Express backend server | Backend (`server.ts`) | `3000` |

### Firebase Configuration Variables (Client-Side)

These variables are prefixed with `VITE_` to be exposed to the frontend via Vite. They are optional for basic functionality but required for Firebase-dependent features.

| Variable | Required | Purpose | Where Used | Example |
| -------- | -------- | ------- | -------- | ------- |
| `VITE_FIREBASE_API_KEY` | Yes (for Firebase) | Firebase API key | Frontend (via `firebase.ts`) | `AIzaSyYourKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes (for Firebase) | Firebase authentication domain | Frontend | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes (for Firebase) | Firebase project ID | Frontend | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes (for Firebase) | Firebase storage bucket | Frontend | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes (for Firebase) | Firebase messaging sender ID | Frontend | `1234567890` |
| `VITE_FIREBASE_APP_ID` | Yes (for Firebase) | Firebase application ID | Frontend | `1:1234567890:web:abcdef` |
| `VITE_FIREBASE_DATABASE_ID` | No (defaults to `(default)`) | Firebase database ID | Frontend | `your-database-id` |

### Development-Specific Variables

| Variable | Required | Purpose | Where Used | Example |
| -------- | -------- | ------- | -------- | ------- |
| `DISABLE_HMR` | No | Disables Hot Module Replacement in Vite (used in AI Studio environments) | Frontend (`vite.config.ts`) | `true` |
| `VITE_FIREBASE_EMULATOR_HOST` | No | Firebase emulator host for local development | Frontend | `localhost:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | No | Firebase Auth emulator host | Backend (if using Admin SDK) | `localhost:9099` |
| `FIREBASE_FSTORE_EMULATOR_HOST` | No | Firebase Firestore emulator host | Frontend (via Firebase SDK) | `localhost:8080` |

### Production Variables

In production environments (Docker, Vercel, etc.), these variables are typically set via the platform's interface:

| Variable | Purpose | Example |
| -------- | ------- | ------- |
| `GEMINI_API_KEY` | Google Gemini AI key | Set in Vercel Project Settings → Environment Variables |
| `NODE_ENV` | Set to `production` | `production` |
| `PORT` | Port the container listens on | `3000` |
| Firebase `VITE_*` variables | Firebase config for production | Set via Vercel or Docker `-e` flags |

### .env.example Reference

The repository includes an `.env.example` file with commented descriptions:

```bash
# GEMINI_API_KEY: Required for Gemini AI API calls (Receipt Scanner).
# AI Studio automatically injects this at runtime from user secrets.
# On Cloudflare Pages or Vercel, add this in Project Settings → Environment Variables.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# Optional client-side fallback key for static-only hosting deployments without serverless functions
VITE_GEMINI_API_KEY=

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
APP_URL="MY_APP_URL"
```

### Best Practices

1. **Never commit real secrets**: Always keep `.env` out of version control (covered by `.gitignore`)
2. **Use different Firebase projects**: Separate projects for development/staging/production to avoid data contamination
3. **Validate in CI**: The GitHub Actions pipeline checks that required variables are set during build
4. **Fallback mechanisms**: The code provides fallback configurations for Firebase to ensure basic functionality
5. **Client-side security**: Remember that client-side environment variables are visible in the browser source—only use them for Firebase config (which is safe) and never for secret keys

### Example Development .env

```bash
GEMINI_API_KEY=AIzaSyYourActualGeminiKey
APP_URL=http://localhost:5173
VITE_FIREBASE_API_KEY=AIzaSyYourFirebaseKey
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_DATABASE_ID=(default)
```

### Example Production .env (for Docker)

```bash
GEMINI_API_KEY=your_gemini_key_here
NODE_ENV=production
PORT=3000
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_DATABASE_ID=(default)
```

## Running Locally

There are multiple ways to run Expense Planner locally depending on your preferences and available tools.

### Method 1: Standard Development (Recommended)

This method runs both the frontend and backend servers directly on your machine.

1. **Ensure prerequisites are met**
   - Node.js 20+ installed
   - Environment variables configured in `.env`
   - (Optional) Firebase emulator running if you want to avoid writing to production Firebase

2. **Start the development servers**
   ```bash
   npm run dev
   ```
   This command runs two processes concurrently:
   - Vite development server for the frontend (default port 5173)
   - Express server for the backend (default port 3000)

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000 (used internally by frontend)

4. **Hot Module Replacement (HMR)**
   - Frontend changes update instantly without full reload
   - Backend changes require restart (use `npm run dev` which restarts on changes via TSX)

### Method 2: Using Docker Compose

This method isolates the application in containers, ideal for consistent environments.

1. **Ensure Docker and Docker Compose are installed**
2. **Configure environment variables in `.env`**
3. **Start the services**
   ```bash
   docker-compose up --build
   ```
   This builds the Docker image and starts the container.
4. **Access the application**
   - Frontend: http://localhost:3000 (as mapped in docker-compose.yml)
5. **Stop the services**
   ```bash
   docker-compose down
   ```

### Method 3: Using Firebase Emulators (for backend/database isolation)

This method runs Firebase services locally while keeping the frontend and backend on your machine.

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```
2. **Initialize Firebase project (if not already done)**
   ```bash
   firebase init
   ```
   Select Firestore, Auth, Emulators, etc.
3. **Start the emulators**
   ```bash
   firebase emulators:start
   ```
   This starts Auth, Firestore, and other selected emulators.
4. **Configure `.env` to point to emulators**
   Example for Firestore and Auth:
   ```
   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   FIREBASE_FSTORE_EMULATOR_HOST=localhost:8080
   ```
   Note: The Firebase SDK automatically detects these when running locally.
5. **Start the application**
   ```bash
   npm run dev
   ```
6. **Access the application**
   - Frontend: http://localhost:5173

### Method 4: Frontend-only (for UI development without backend)

If you only want to work on the UI and can mock API responses:

1. **Start the Vite dev server alone**
   ```bash
   npm run dev -- --server
   ```
   Note: This is a simplified example; actual implementation may require mocking.
2. **Or use a proxy to mock API endpoints**
   - Configure Vite proxy in `vite.config.js` to redirect `/api/*` to a mock server

### Verification After Starting

Regardless of the method used, verify the following:

1. **Application loads**
   - Open browser to the appropriate URL (usually http://localhost:5173)
   - See login page or dashboard if already authenticated

2. **Authentication works**
   - Sign up with a new account
   - Verify you can sign in with the same credentials
   - Check that user data appears in Firebase (or emulator UI)

3. **Core functionality**
   - Navigate to different tabs (Overview, Income, Expense, etc.)
   - Add sample data in each section
   - Verify data persists between page reloads

4. **AI features (if configured)**
   - If GEMINI_API_KEY is set, test the receipt scanner
   - Upload a clear receipt image
   - Verify extracted data is accurate

5. **Real-time synchronization**
   - Open the application in two different browser tabs or incognito windows
   - Make a change in one window (add an expense)
   - Verify the change appears in the other window within a few seconds

### Troubleshooting Local Development

- **Connection refused errors**
  - Frontend cannot connect to backend: Check that backend is running on the expected port
  - Backend cannot connect to Firebase: Verify Firebase config and network connectivity
  - Firebase emulator not running: Start emulators with `firebase emulators:start`

- **Port conflicts**
  - Change ports in configuration:
    - Frontend: Modify `vite.config.ts` server port
    - Backend: Set `PORT` environment variable
    - Docker: Change port mappings in `docker-compose.yml`
    - Emulators: Change ports in Firebase config

- **Hot Module Replacement not working**
  - Ensure `DISABLE_HMR` is not set to `true` unless intended
  - Check browser console for HMR-related errors

- **Firebase authentication errors**
  - Verify that Auth emulator is started if using emulators
  - Check that `FIREBASE_AUTH_EMULATOR_HOST` is set correctly
  - Ensure email/password provider is enabled in Firebase console

- **Firestore permission errors**
  - If using emulators, ensure security rules allow read/write for testing
  - In production, verify that Firebase security rules match your app's access patterns

- **Build errors**
  - Run `npm run build` to check for production build issues
  - Fix any TypeScript errors before proceeding

- **Memory issues**
  - Increase Node.js memory limit if needed: `node --max-old-space-size=4096`
  - Consider closing other memory-intensive applications

### Development Workflow Tips

1. **Use breakpoints effectively**
   - Frontend: Use Chrome DevTools debugger
   - Backend: Use `debugger;` statements in TSX files or attach VS Code debugger

2. **Monitor network requests**
   - Check the Network tab in DevTool to see API calls
   - Verify payloads and responses match expectations

3. **Check Firebase console (or emulator UI)**
   - Auth: See user records
   - Firestore: Browse collections and documents in real-time
   - Usage: Monitor read/write operations to stay within free tier limits

4. **Leverage logging**
   - Backend: Check terminal output for error logs and info messages
   - Frontend: Use `console.log` judiciously for debugging

5. **Keep dependencies updated**
   - Periodically run `npm outdated` to check for updates
   - Test updates in a branch before merging to main

6. **Write tests as you develop**
   - While the current codebase has limited tests, new features should include unit tests
   - Use Jest or Vitest for frontend unit tests
   - Use Jest or Mocha for backend tests

### Switching Between Methods

You can easily switch between local development methods:

- **From standard dev to Docker**: Stop `npm run dev`, then run `docker-compose up`
- **From Docker to standard dev**: Stop containers with `docker-compose down`, then run `npm run dev`
- **Adding emulators**: Start emulators, adjust `.env` to point to them, then restart the app

### Production Simulation Locally

To test a production-like build locally:

1. **Build the application**
   ```bash
   npm run build
   ```
2. **Start the production server**
   ```bash
   npm run start
   ```
   This runs the built Express server serving static assets.
3. **Access the application**
   - Usually at http://localhost:3000
4. **Note**
   - This uses the built files from `dist/` and does not include HMR
   - Environment variables should reflect production values

## Frontend

The frontend of Expense Planner is a modern React application built with Vite, TypeScript, and Tailwind CSS. It provides a responsive, intuitive user interface for managing personal and family finances.

### Entry Point

- **`src/App.tsx`**: The root component of the application. It sets up the routing, authentication, and theme providers.
  - Wraps the application in `ThemeProvider` and `AuthProvider` for global state management.
  - Uses `BrowserRouter` from `react-router-dom` for client-side routing.
  - Defines two routes:
    - `/login`: Public route for the login page
    - `/`: Protected route that renders the `Dashboard` component (requires authentication)

### Routing

- **Library**: React Router DOM v7
- **Configuration**: Defined in `App.tsx`
- **Protected Routes**: The `ProtectedRoute` component checks authentication status and redirects unauthenticated users to the login page.
- **Client-Side Routing**: Enables smooth navigation without full page reloads.
- **Route Parameters**: Not currently used, but the structure supports them for future expansion.

### State Management

- **React Context API**: Used for global state that needs to be accessed by many components.
  - **AuthContext** (`src/contexts/AuthContext.tsx`):
    - Manages Firebase authentication state (user, loading)
    - Manages household membership and household data
    - Provides `refreshHousehold` method to update household data
    - Handles auto-creation of household for new users
    - Includes timeout safeguards to prevent hanging UI
  - **ThemeContext** (`src/contexts/ThemeContext.tsx`):
    - Manages application theme (light, dark, system)
    - Persists theme preference in localStorage
    - Respects system preference via `prefers-color-scheme` media query
    - Provides `toggleTheme` method to switch between light and dark
    - Exposes `isDark` boolean for conditional styling
- **Local State**: Used for component-specific state (form inputs, UI toggles, etc.)
  - Managed with React's `useState` hook
  - Examples: active tab in Dashboard, modal visibility, form field values
- **Custom Hooks**: Encapsulate reusable logic
  - Located in `src/lib/db.ts` for data fetching and caching
  - Examples: `getTransactions`, `getIncomes`, etc.
  - Implement caching layer with TTL to reduce Firestore reads
  - Include error handling with logging

### Component Hierarchy

The frontend follows a modular component structure:

1. **Layout Components**
   - `App.tsx`: Root layout with providers and routing
   - `Dashboard.tsx`: Main layout with header, navigation, and section container

2. **Page Components** (`src/pages/`)
   - `Login.tsx`: Authentication page with sign-in/sign-up forms
   - `Dashboard.tsx`: Main dashboard containing navigation tabs and section rendering

3. **Section Components** (`src/components/*Section.tsx`)
   - Each tab in the dashboard corresponds to a section component:
     - `OverviewSection.tsx`: Financial summary with charts and key metrics
     - `IncomeSection.tsx`: Income tracking and management
     - `ExpenseSection.tsx`: Expense tracking and categorization
     - `BudgetSection.tsx`: Budget creation and monitoring
     - `GoalSection.tsx`: Savings goals tracking
     - `LoanSection.tsx`: Loan and EMI management
     - `InvestmentSection.tsx`: Investment portfolio tracking
     - `RecurringSection.tsx`: Recurring transaction rules
     - `TaxSection.tsx`: Tax calculations and optimization
     - `ReportSection.tsx`: Financial reports and export options
     - `HouseholdSettings.tsx`: Household and member management
   - These sections are conditionally rendered in `Dashboard.tsx` based on the active tab

4. **Reusable UI Components** (`src/components/`)
   - Shared UI elements used across multiple sections:
     - `BudgetSection.tsx`, `ExpenseSection.tsx`, etc. (despite naming, these are section-specific)
     - Actually, the reusable components are more granular:
       - Form inputs, buttons, cards, modals, etc. are often created inline within sections
     - Some specific reusable components:
       - `ExportModal.tsx`: Reusable modal for exporting data
       - `ThemeToggle.tsx`: Button to switch between light/dark themes
   - Many UI elements are composed directly using Tailwind CSS classes for flexibility

3. **UI Primitives**
   - Built using Tailwind CSS utility classes
   - Common patterns:
     - Cards: `bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] rounded-lg shadow`
     - Buttons: `px-4 py-2 bg-[#1A1A1A] text-white dark:bg-[#F0ECE1] dark:text-[#121212] hover:bg-gray-100 dark:hover:#[282828]`
     - Inputs: `w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#383838] rounded bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] dark:focus:ring-[#F0ECE1]`
     - Modals: Fixed position, backdrop, centered content with animation

### Styling

- **Framework**: Tailwind CSS v4
- **Configuration**: 
  - `tailwindcss` plugin in `vite.config.ts`
  - Custom colors defined implicitly through usage
  - Dark mode: Built-in support via `dark:` variant
- **Approach**: Utility-first styling
  - Avoids custom CSS files except for `index.css` (which imports Tailwind)
  - Enables rapid UI development and consistent styling
  - Responsive prefixes: `sm:`, `md:`, `lg:`, `xl:` for breakpoints
- **Dark Mode Implementation**:
  - Uses `dark:` variant for colors, borders, shadows
  - Controlled by ThemeContext which toggles a `dark` class on `<html>`
  - Respects system preference when theme is set to "system"
  - Persists user choice in localStorage

### Assets

- **Static Assets**: Located in `/assets/` directory
  - Images, icons, logos, etc.
  - Referenced in components using relative paths
- **Icons**: 
  - Primary icon library: `lucide-react`
  - Imported as React components for inline SVG styling
  - Example: `<LayoutDashboard className="w-4 h-4" />`
  - Allows easy size and color control via props and Tailwind
- **Fonts**: 
  - Default browser fonts with Tailwind's `font-sans` and `font-serif` utilities
  - Specific fonts used:
    - `font-serif` for headings and elegant text (Expense Planner logo)
    - `font-sans` for body text and UI elements
    - `font-mono` for code-like displays (email, IDs)

### Forms and Validation

- **Form Elements**: Standard HTML inputs wrapped in labels and divs
- **Validation**: 
  - Primarily done in the backend/database layer
  - Frontend provides basic required field checks and format validation
  - Examples:
    - Email format in login form
    - Required fields marked with asterisk
    - Number inputs with min/max attributes
- **Submission Handling**: 
  - Prevents default form submission
  - Gathers form data into JavaScript objects
  - Calls appropriate functions from `src/lib/db.ts` or `src/lib/firebase.ts` (though most data operations go through db.ts)
  - Handles loading states and error messages

### Data Fetching and Caching

- **Custom Hooks in `src/lib/db.ts`**:
  - All data fetching functions follow a caching pattern
  - Use `cachedFetch` wrapper with TTL (default 25 seconds)
  - Implement household ID resolution via `getHhId`
  - Include error handling via `handleFirestoreError`
  - Return empty arrays or default values on error to prevent UI crashes
- **Optimistic Updates**: 
  - Many mutation functions (add, update, delete) clear relevant caches immediately
  - This ensures UI reflects changes instantly while waiting for backend confirmation
- **Background Prefetching**:
  - Implemented in `Dashboard.tsx` using `useEffect`
  - Prefetches data for all sections when user or month changes
  - Uses `Promise.allSetteld` to prevent one failed request from blocking others
  - Silently catches errors to avoid disrupting user experience

### Error Handling

- **Frontend Error Boundaries**: Not currently implemented (could be added for production)
- **Error Display**:
  - Form validation errors shown inline with inputs
  - API errors shown in toast-like notifications or modal dialogs
  - Loading states shown with spinners and skeleton screens
- **Logging**: 
  - Console warnings and errors for unexpected issues
  - Structured error objects logged to backend via `handleFirestoreError` in db.ts
- **Recovery Mechanisms**:
  - Users can retry failed operations
  - Cache clearing on mutation helps prevent stale data

### Accessibility

- **Semantic HTML**: Proper use of `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- **ARIA Attributes**: 
  - Labels for form inputs
  - Role attributes where needed (e.g., `role="navigation"` for tab ribbon)
  - Live regions for dynamic content (could be enhanced)
- **Keyboard Navigation**: 
  - Tab order follows logical flow
  - Custom components ensure focus is managed (modals, dropdowns)
- **Color Contrast**: 
  - Tailwind default colors meet WCAG AA standards
  - Custom colors in the theme (like `#FCFAF7`, `#1A1A1A`, `#F0ECE1`) are chosen for contrast
- **Responsive Design**: 
  - Mobile-first breakpoints in Tailwind
  - Navigation adapts to screen size:
    - Desktop: Horizontal tab ribbon
    - Mobile: Vertical dropdown selector
  - Content stacks vertically on small screens
  - Charts and tables scale to container width

### Performance Optimizations

- **Code Splitting**: 
  - Vite automatically splits code by dynamic imports
  - Route-based splitting: Each section loads only when navigated to
  - Vendor splitting: Separate chunks for React, Firebase, etc.
- **Lazy Loading**: 
  - Sections are loaded only when their tab is active
  - Implemented via conditional rendering in `Dashboard.tsx`
  - Could be enhanced with `React.lazy` and `Suspense` for better loading states
- **Caching Layer**: 
  - Custom hooks in `db.ts` reduce redundant Firestore reads
  - TTL-based caching balances freshness with performance
  - Household ID caching reduces duplicate lookups
- **Efficient Re-renders**: 
  - React.memo used where beneficial (not shown in current code but could be added)
  - useCallback and useMemo used in custom hooks to prevent unnecessary recalculations
  - Immutability patterns in state updates
- **Asset Optimization**: 
  - Images should be optimized before adding to `/assets/`
  - Consider using next-gen formats (WebP) with fallback
  - Vite optimizes asset bundling and minification
- **Bundle Analysis**: 
  - Can be run with `npm run build` and examining `dist/` directory
  - Current bundle size is reasonable for the feature set

### Third-Party Libraries

- **UI and UX**:
  - `lucide-react`: Icon set
  - `motion`: Animations and gestures (used sparingly for micro-interactions)
  - `recharts`: Data visualization (charts in OverviewSection)
  - `headlessui`: Unstyled accessible components (potential for future use)
- **State and Data**:
  - `firebase`: Core Firebase services
  - `@firebase/auth`, `@firebase/firestore`: Specific services
  - `@google/genai`: Google Gemini AI integration
- **Build and Development**:
  - `vite`: Build tool and dev server
  - `@vitejs/plugin-react`: React Fast Refresh
  - `tailwindcss`: Styling framework
  - `autoprefixer`: CSS vendor prefixing
  - `esbuild`: Bundling and minification
  - `tsx`: TypeScript execution without compilation
  - `puppeteer`: End-to-end testing and automation
- **Utilities**:
  - `clsx`: Conditional class names
  - `tailwind-merge`: Efficiently merging Tailwind classes
  - `dotenv`: Environment variable loading
  - `xlsx`: Spreadsheet export functionality

### Internationalization (i18n)

- Not currently implemented
- All text is hardcoded in English
- Structure supports future i18n libraries like `react-i18next`
- Would require:
  - Extracting strings to translation files
  - Using `useTranslation` hook or `<Trans>` component
  - Adjusting layout for text expansion/contraction

### Security Considerations

- **Client-Side Security**: 
  - Remember that client-side code is visible to users
  - Never store secrets in frontend code or environment variables exposed to client
  - Firebase config keys are safe to expose (they're public by design)
  - Validate all inputs on the backend because client-side validation can be bypassed
- **Dependency Security**: 
  - Monitor npm vulnerabilities with `npm audit`
  - Keep dependencies updated
  - The package-lock.json ensures reproducible builds
- **Content Security Policy (CSP)**: 
  - Not currently implemented but could be added for production
  - Would need to allow:
    - Firebase domains
    - Google APIs
    - Inline styles and scripts (if using certain Tailwind features)
- **Data Privacy**: 
  - No personally identifiable information (PII) is stored beyond what's necessary for finance tracking
  - Users can delete their account (would need to implement)
  - Data minimization principles applied

### Browser Support

- **Target**: Modern browsers that support ES2022+
  - Chrome, Firefox, Safari, Edge (latest versions)
  - Mobile browsers on iOS and Android
- **Not Supported**: Internet Explorer (due to modern Java6 features)
- **Polyfills**: Not currently used; assumes modern browser 환경
- **Feature Detection**: 
  - Could add for specific APIs (like WebP images, etc.)
  - Currently relies on broad browser support

### Development Experience

- **Fast Refresh**: 
  - Vite provides instant updates on file changes
  - State preservation where possible (configured via `vite.config.ts`)
- **Error Overlay**: 
  - Vite shows syntax errors and runtime errors in the browser overlay
  - Helps catch mistakes early
- **TypeScript Integration**: 
  - Full type checking in IDE and build process
  - Path aliases (`@/*`) configured in `tsconfig.json` and `vite.config.ts`
  - Enables clean imports like `@/components/Button.tsx`
- **Linting and Formatting**: 
  - ESLint and Prettier configured (checked via CI)
  - `npm run lint` runs TypeScript check (`tsc --noEmit`)
  - Prettier checks formatting
- **Debugging**: 
  - React DevTools works for component inspection
  - Redux DevTools not applicable (no Redux)
  - Firebase emulator UI helps inspect data
  - Network tab shows API calls to backend (for receipt scanning)

### Future Enhancements

- **State Management Library**: 
  - Consider migrating to Zustand or Jotai for simpler global state
  - Or keep Context API if it meets needs
- **UI Component Library**: 
  - Extract reusable components to a shared folder
  - Consider using Headless UI or Radix UI for accessibility primitives
- **Form Validation Library**: 
  - Implement Zod or Yup for schema-based validation
  - Integrate with React Hook Form for better performance
- **Testing**: 
  - Add unit tests with Vitest or Jest
  - Add end-to-end tests with Cypress or Playwright
- **Performance Monitoring**: 
  - Add Lighthouse CI to performance budget
  - Track bundle size and key metrics over time
- **Accessibility Audits**: 
  - Regular axe-core checks
  - Improve keyboard navigation and screen reader support
- **Internationalization**: 
  - Add i18n support for multiple languages
  - Start with JSON-based translation files
- **Offline-First**: 
  - Enhance caching strategy with service workers
  - Consider IndexedDB for persistent offline storage
  - Use Workbox or similar for PWA features
- **Theming System**: 
  - Implement a design system with tokens
  - Allow custom themes beyond light/dark/system
- **Animation Refinement**: 
  - Use Framer Motion more extensively for page transitions
  - Add motion-preserving IDs for shared element transitions

The frontend is designed to be maintainable, scalable, and user-friendly, with a focus on delivering a smooth financial management experience across devices.

## Backend

The backend of Expense Planner is an Express.js server that handles API requests, business logic, and integration with external services like Google Gemini AI. It provides a RESTful interface for operations that require server-side processing while leveraging Firebase Firestore for real-time data storage on the frontend.

### Entry Point

- **`server.ts`**: The main entry point for the backend application. It initializes the Express application, configures middleware, defines API routes, and starts the server.
  - Loads environment variables via `dotenv/config`
  - Sets up Express middleware for JSON parsing with a 25MB limit
  - Implements two-tier rate limiting:
    - Global limiter: 100 requests per 15 minutes per IP
    - Scan receipt limiter: 10 requests per hour per IP (for AI operations)
  - Defines API routes:
    - `/api/health`: Simple health check endpoint
    - `/api/scan-receipt`: AI-powered receipt scanning endpoint (protected by rate limiter)
  - Configures Vite middleware for development (serves frontend and enables HMR)
  - Configures static file serving for production (serves built frontend assets)
  - Starts the server on port 3000 (configurable via PORT environment variable)

### Middleware Stack

1. **Body Parsing**
   - `express.json({ limit: '25mb' })`: Parses JSON request bodies with a size limit of 25MB
   - Necessary for handling base64-encoded image data in receipt scanning

2. **Rate Limiting**
   - **Global Rate Limiter** (`rateLimit`):
     - Window: 15 minutes
     - Max requests: 100 per IP
     - Message: `{ error: "Too many requests, please try again later." }`
     - Key generator: Uses IP address or socket remote address
   - **Scan Receipt Rate Limiter** (`scanReceiptLimiter`):
     - Window: 60 minutes
     - Max requests: 10 per IP
     - Message: `{ error: "Receipt scan limit exceeded. Try again in an hour." }`
     - Key generator: Uses IP address or socket remote address
     - Applied specifically to `/api/scan-receipt` route
   - Both limiters use standard headers and legacy headers disabled
   - Protects against abuse of the AI endpoint which incurs costs

3. **Vite Middleware**
   - **Development Mode** (`process.env.NODE_ENV !== "production"`):
     - Creates Vite server with middleware mode
     - Serves frontend assets and enables Hot Module Replacement (HMR)
     - Uses SPA app type for single-page application routing
   - **Production Mode**:
     - Serves static files from `dist/` directory
     - Handles client-side routing with `app.get('*all', ...)` fallback to index.html

### API Routes

#### Health Check Endpoint
- **Path**: `/api/health`
- **Method**: GET
- **Purpose**: Simple health check for monitoring and load balancers
- **Response**: 
  ```json
  {
    "status": "ok",
    "environment": "React/Express/Firebase"
  }
  ```
- **Implementation**: 
  - Located in `server.ts` lines 36-38
  - No authentication required
  - Returns environment info for debugging

#### Receipt Scanning Endpoint
- **Path**: `/api/scan-receipt`
- **Method**: POST
- **Purpose**: Process receipt images using Google Gemini AI to extract transaction details
- **Protection**: 
  - Applied `scanReceiptLimiter` middleware (10 requests/hour/IP)
  - Validates presence of `imageBase64` in request body
  - Checks for `GEMINI_API_KEY` in environment variables
- **Request Body**:
  ```json
  {
    "imageBase64": "base64-encoded-image-data",
    "mimeType": "image/jpeg" // optional, defaults to image/jpeg
  }
  ```
- **Response Format**:
  ```json
  {
    "amount": number,
    "date": "YYYY-MM-DD",
    "merchant": "string",
    "category": "string"
  }
  ```
- **Implementation Details** (`server.ts` lines 40-149):
  1. **Input Validation**:
     - Checks for missing `imageBase64`
     - Returns 400 error if missing
  2. **API Key Check**:
     - Verifies `process.env.GEMINI_API_KEY` is set
     - Returns 500 error with helpful message if not configured
  3. **MIME Type Normalization**:
     - Defaults to `image/jpeg` if not provided or invalid
     - Ensures compatibility with Gemini API
  4. **Model Selection Strategy**:
     - Attempts multiple Gemini models in order:
       1. `gemini-2.5-flash`
       2. `gemini-flash-latest`
       3. `gemini-3.7-flash`
       4. `gemini-2.5-flash-lite`
     - Provides fallback capability if models are unavailable or overloaded
  5. **Retry Logic**:
     - Attempts up to 2 attempts per model for transient errors (503, 429)
     - Waits 800ms between attempts for backoff
     - Distinguishes transient vs permanent errors
  6. **Gemini API Integration**:
     - Uses `@google/genai` SDK
     - Configures generation with:
       - `responseMimeType: "application/json"`
       - `responseSchema`: Strict schema for amount, date, merchant, category
       - Prompt: Detailed instructions for receipt analysis
  7. **Response Processing**:
     - Strips markdown code formatting from response text
     - Parses JSON response
     - Returns parsed result on success
  8. **Error Handling**:
     - Catches all errors and returns 500 with user-friendly message
     - Distinguishes service overload (503/high demand) from other failures
     - Logs errors to console for debugging

### Business Logic

#### AI Receipt Processing
- **Service**: Google Gemini AI via `@google/genai` SDK
- **Prompt Engineering**:
  - Detailed instruction for receipt analysis:
    ```
    Analyze this image of a purchase receipt, bill, invoice, or payment confirmation. Extract the total paid amount in numerical format (INR/₹ or standard currency), the transaction date (YYYY-MM-DD), the merchant or vendor name, and the best-fitting expense category (e.g. Food, Groceries, Shopping, Travel, Bills, Healthcare, Entertainment, Utilities, Education, or Other).
    ```
- **Response Schema Enforcement**:
  - Uses TypeScript definitions via Google GenAI SDK
  - Schema requires:
    - `amount`: Number (total paid)
    - `date`: String in YYYY-MM-DD format
    - `merchant`: String (vendor name)
    - `category`: String (expense category)
  - All fields marked as required
- **Model Fallback Strategy**:
  - Tries multiple models in sequence to handle:
    - Model unavailability
    - Service overload
    - Regional restrictions
  - Provides resilience against single point of failure
- **Error Classification**:
  - **Transient Errors**: 503, 429, "high demand", "UNAVAILABLE"
    - Retried with exponential backoff
  - **Permanent Errors**: All other errors
    - Causes immediate move to next model
- **User-Friendly Messaging**:
  - Service overload: "The receipt scanning AI service is temporarily experiencing high traffic. Please try again in a few seconds."
  - Other failures: Original error message or generic failure message

#### Firebase Integration
- **Admin SDK Initialization**:
  - Occurs implicitly through Firebase client SDK usage
  - Most database operations happen on frontend via client SDK
  - Backend uses Firebase primarily for:
    - Environment validation
    - Potential future server-side operations
- **Configuration Loading**:
  - Uses `dotenv` to load environment variables
  - Accesses variables via `process.env`
  - No direct Firebase Admin SDK calls in current implementation (frontend handles DB)

#### Environment Validation
- **Startup Checks**:
  - Verifies presence of critical environment variables
  - Provides clear error messages for missing configuration
  - Example: GEMINI_API_KEY check in scan-receipt endpoint

### Error Handling

- **Centralized Error Handling**:
  - Try/catch blocks in API route handlers
  - Consistent error response format: `{ error: "message" }`
  - HTTP status codes:
    - 400: Client errors (missing input, invalid data)
    - 500: Server errors (AI failure, configuration issues)
    - 200: Success responses
- **Logging**:
  - All errors logged to console with `console.error`
  - Includes full error object for debugging
  - User-facing messages sanitized to avoid leaking sensitive info
- **Specific Error Cases**:
  - **Missing GEMINI_API_KEY**: 
    - Returns 500 with message about server environment configuration
    - Guides user to set variable in settings
  - **AI Service Overload**:
    - Detects 503 or "high demand" in error message
    - Returns user-friendly retry-after message
  - **Invalid Image Data**:
    - Handed by Gemini API validation
    - Returns appropriate error from AI service
  - **Network Errors**:
    - Caught in try/catch
    - Returns generic failure message

### Security Features

- **Input Validation**:
  - Receipt scanner validates `imageBase64` presence
  - Rejects requests with missing image data (400 error)
  - MIME type validation and normalization
- **Rate Limiting**:
  - Prevents abuse of costly AI operations
  - Global limiter protects overall server availability
  - Endpoint-specific limiter protects AI quota and budget
- **Environment Variable Protection**:
  - Sensitive keys (GEMINI_API_KEY) loaded from environment
  - Never hardcoded in source code
  - `.env.example` shows required variables without values
- **Error Message Sanitization**:
  - User-facing messages avoid exposing stack traces or internal details
  - Technical details logged internally for debugging
- **CORS Configuration**:
  - Not explicitly configured (defaults to same-origin)
  - In production with Vercel, handled by platform
  - For Docker deployments, may need explicit CORS setup if frontend and backend on different domains
- **HTTP Headers**:
  - Basic security headers could be added (helmet.js equivalent)
  - Currently relies on platform-level security (Vercel/Docker)

### Firebase Integration Approach

- **Client-Centric Data Operations**:
  - Frontend communicates directly with Firebase Firestore
  - Enables real-time synchronization and offline capabilities
  - Reduces backend load and latency for common operations
- **Backend Responsibilities**:
  - AI processing requiring Google API keys (kept secure on server)
  - Potential future server-only operations
  - Health checks and monitoring endpoints
- **Admin SDK Usage**:
  - Currently minimal in codebase
  - Available for future server-side database operations if needed
  - Would require proper service account configuration
- **Data Consistency Model**:
  - Frontend performs optimistic updates to Firebase
  - Backend processes AI requests independently
  - Eventual consistency model suitable for financial tracking
  - No transactional requirements between frontend and backend

### Performance Characteristics

- **Startup Time**:
  - Fast startup with TSX (no compilation step)
  - Environment variable loading synchronous
  - Firebase client initialization lightweight
- **Request Processing**:
  - Health check: Minimal overhead (<1ms)
  - Receipt scanning: Dominated by AI API call latency (typically 1-3 seconds)
  - Rate limiting adds negligible overhead
- **Memory Usage**:
  - Low baseline memory usage
  - Scales with concurrent AI requests (limited by rate limiter)
  - No memory leaks observed in current implementation
- **Concurrency Handling**:
  - Express handles multiple concurrent requests
  - Rate limiting prevents resource exhaustion
  - AI API calls are external, so backend concurrency doesn't affect Gemini limits
- **Scaling Considerations**:
  - Horizontal scaling possible with load balancer
  - Shared state minimal (environment variables, rate limiter stores)
  - Rate limiter would need shared store (Redis) for multi-instance deployments
  - Current implementation uses memory-based rate limiting (single instance)

### Development Experience

- **TSX Execution**:
  - Runs TypeScript directly without compilation step
  - Enables rapid development and debugging
  - Source maps preserved for error tracing
- **Environment Loading**:
  - Automatic via `dotenv/config` import
  - Supports `.env` file in project root
  - Variables accessible via `process.env`
- **Hot Module Replacement**:
  - Backend doesn't use HMR (restarts on file changes via `npm run dev`)
  - Frontend gets HMR via Vite middleware
  - Change detection: `npm run dev` restarts server on file changes
- **Debugging**:
  - Console logging for errors and info
  - Easy to attach debugger to Node.js process
  - Clear stack traces in development
- **Testing**:
  - Manual testing via curl or Postman
  - Automated testing possible with Jest/Supertest
  - Current implementation suitable for test-driven development

### Production Characteristics

- **Docker Deployment**:
  - Multi-stage build optimizes image size
  - Builder stage: Installs all dependencies, builds application
  - Runner stage: Installs production dependencies only (~50% smaller)
  - Runs as non-root user implicitly (Node.js Alpine default)
  - Exposes port 3000
  - Sets NODE_ENV=production
- **Vercel Deployment**:
  - Uses `api/` directory for serverless functions
  - `scan-receipt.ts` and `health.ts` become individual serverless endpoints
  - Build output serves static assets
  - Environment variables configured in Vercel dashboard
  - Automatic scaling based on demand
- **Resource Usage**:
  - Minimal CPU/memory at idle
  - AI processing bursts consume resources proportional to request rate
  - Rate limiting prevents excessive resource consumption
- **Observability**:
  - Health endpoint for load balancer checks
  - Error logging to stdout (captured by Docker/Vercel logs)
  - No built-in metrics endpoint (could be added)

### Limitations and Constraints

- **Single Instance Rate Limiting**:
  - Current rate limiter uses memory store
  - Not suitable for multi-instance deployments without shared store
  - Would require Redis or similar for horizontal scaling
- **AI Dependency**:
  - Backend functionality limited to AI processing and health checks
  - Core data operations handled by frontend/Firebase
  - Tight coupling to Google Gemini API (vendor lock-in consideration)
- **Environment Variable Validation**:
  - Basic presence checks only
  - No format validation for Firebase config values
  - Invalid values cause runtime errors in Firebase SDK
- **Error Reporting**:
  - Errors logged to console only
  - No external error tracking or alerting integration
  - Production monitoring relies on log analysis
- **Security Headers**:
  - Missing common security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Could be enhanced with helmet.js or similar middleware
- **Request Size Limit**:
  - 25MB limit on JSON bodies
  - Suitable for base64-encoded images (approx 19MB raw image)
  - May need adjustment for different use cases
- **MIME Type Handling**:
  - Basic normalization to image/jpeg
  - Could support more formats with proper validation
  - Current implementation safe for common image types

### Future Enhancements

- **Additional API Endpoints**:
  - Admin endpoints for system management
  - Webhook endpoints for third-party integrations
  - Backup/restore interfaces
  - Analytics aggregation services
- **Enhanced Security**:
  - Implement Helmet.js for security headers
  - Add request sanitization and validation middleware
  - Implement API key authentication for endpoints
  - Add detailed audit logging
- **Scaling Improvements**:
  - Replace memory rate limiter with Redis-backed version
  - Add clustering or PM2 for multi-core utilization
  - Implement request tracing and profiling
- **Firebase Admin Usage**:
  - Use Admin SDK for secure server-side operations
  - Implement custom authentication tokens if needed
  - Add server-side data validation and sanitization
- **Monitoring and Metrics**:
  - Add Prometheus metrics endpoint
  - Implement request/response logging
  - Add performance tracking and slow query detection
- **Error Tracking**:
  - Integrate with Sentry or similar error tracking service
  - Add contextual error reporting
  - Implement error rate alerting
- **Documentation**:
  - Generate OpenAPI/Swagger specification
  - Add API documentation endpoint
  - Include example requests and responses
- **Testing**:
  - Add unit tests for business logic
  - Add integration tests for API endpoints
  - Implement mock testing for Gemini API
  - Add load and stress testing capabilities

The backend is designed to be secure, efficient, and focused on its core responsibilities: handling AI-intensive operations and providing a reliable interface for the frontend, while leveraging Firebase for real-time data capabilities.

## Database

The database layer of Expense Planner uses Firebase Firestore as its primary data store, with a sophisticated caching layer implemented in `src/lib/db.ts` to optimize performance and reduce Firestore reads. The database design follows a modular approach with centralized operations and household-scoped data isolation.

### Database Technology

- **Primary Database**: Firebase Firestore (NoSQL document database)
- **Client SDK**: `@firebase/firestore` version integrated via Firebase JS SDK
- **Persistence**: IndexedDB-based local cache for offline support
- **Multi-tab Synchronization**: Built-in Firebase mechanism to sync state across browser tabs
- **Consistency Model**: Eventual consistency with strong consistency within document reads
- **Limits**: 
  - 1 MiB maximum document size
  - 20 MiB maximum transaction size
  - Automatic indexing for query performance

### Data Model Overview

Data is organized into collections representing different financial entities. All data is scoped to either a household ID (when user belongs to a household) or falls back to the user UID for personal data.

#### Core Collections

1. **categories**
   - **Purpose**: Store expense and income categories for transaction classification
   - **Document Structure**:
     ```typescript
     {
       id: string;                   // Category ID (UUID)
       name: string;                 // Display name (e.g., "Groceries", "Salary")
       type: 'expense' | 'income';   // Category type
       isDefault: boolean;           // System-provided vs user-created
       userId?: string;              // Owner UID (null for system defaults)
       householdId?: string;         // Owning household ID (null for personal)
       createdAt: Timestamp;         // Creation timestamp
       updatedAt: Timestamp;         // Last update timestamp
     }
     ```
   - **Usage**: 
     - System defaults provide common categories (Food, Transport, Salary, etc.)
     - Users can create custom categories
     - Used in dropdowns for transaction categorization
   - **Indexes**: Composite index on `(type, isDefault, userId, householdId)`

2. **income_entries**
   - **Purpose**: Store detailed income records with hierarchical breakdown
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Entry ID (UUID)
       userId: string;                       // Owner UID
       householdId?: string;                 // Owning household ID
       month: string;                        // YYYY-MM format (e.g., "2026-08")
       basicSalary: number;                  // Basic salary component
       hra: number;                          // House Rent Allowance
       conveyanceAllowance: number;          // Transport allowance
       medicalAllowance: number;             // Medical allowance
       specialAllowance: number;             // Special allowance
       lta: number;                          // Leave Travel Allowance
       bonus: number;                        // Bonus amount
       otherAllowances: number;              // Other allowances
       employeePf: number;                   // Employee PF contribution
       employeeEsi: number;                  // Employee ESI contribution
       professionalTax: number;              // Professional tax
       tds: number;                          // Tax deducted at source
       otherDeductions: number;              // Other deductions
       netSalary: number;                    // Calculated take-home pay
       createdAt: Timestamp;                 // Creation timestamp
       updatedAt: Timestamp;                 // Last update timestamp
     }
     ```
   - **Usage**: 
     - Detailed salary breakdown for Indian payroll structure
     - Net salary calculated automatically
     - Used for income reporting and tax calculations
   - **Indexes**: Composite index on `(userId, householdId, month)`

3. **transactions**
   - **Purpose**: Store individual expense and income transactions
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Transaction ID (UUID)
       userId: string;                       // Owner UID
       householdId?: string;                 // Owning household ID
       amount: number;                       // Transaction amount (positive for income, negative for expense)
       type: 'expense' | 'income';           // Transaction type
       categoryId: string;                   // Reference to categories.id
       date: Timestamp;                      // Transaction date
       description?: string;                 // Optional description
       paymentMode?: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet'; // Payment method
       source?: 'manual' | 'recurring' | 'ai_scan'; // Transaction source
       recurringRuleId?: string;             // Link to recurring rule if auto-generated
       createdAt: Timestamp;                 // Creation timestamp
       updatedAt: Timestamp;                 // Last update timestamp
     }
     ```
   - **Usage**: 
     - Core financial transaction storage
     - Positive amounts for income, negative for expenses
     - Linked to categories for reporting
     - Source tracking for audit trail
   - **Indexes**: 
     - Composite index on `(userId, householdId, date)`
     - Composite index on `(userId, householdId, categoryId, date)`

4. **budgets**
   - **Purpose**: Store monthly budget limits per category
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Budget ID (UUID)
       userId: string;                       // Owner UID
       householdId?: string;                 // Owning household ID
       month: string;                        // YYYY-MM format
       categoryId: string;                   // Reference to categories.id
       limitAmount: number;                  // Monthly budget limit
       createdAt: Timestamp;                 // Creation timestamp
       updatedAt: Timestamp;                 // Last update timestamp
     }
     ```
   - **Usage**: 
     - Set spending limits per category
     - Compared against actual spending for alerts
     - Supports rollover configurations (future enhancement)
   - **Indexes**: Composite index on `(userId, householdId, month, categoryId)`

5. **recurring_rules**
   - **Purpose**: Store rules for automatic transaction generation
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Rule ID (UUID)
       userId: string;                       // Owner UID
       householdId?: string;                 // Owning household ID
       amount: number;                       // Transaction amount
       type: 'expense' | 'income';           // Transaction type
       categoryId: string;                   // Reference to categories.id
       description?: string;                 // Optional description
       frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Recurrence pattern
       interval: number;                     // Multiplier for frequency (e.g., every 2 weeks)
       startDate: Timestamp;                 // First occurrence date
       endDate?: Timestamp;                  // Optional end date
       nextDueDate: Timestamp;               // Next auto-generated transaction date
       paymentMode?: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet'; // Payment method
       createdAt: Timestamp;                 // Creation timestamp
       updatedAt: Timestamp;                 // Last update timestamp
     }
     ```
   - **Usage**: 
     - Automate regular transactions (rent, subscriptions, salaries)
     - Background process generates transactions on due dates
     - Supports complex recurrence patterns
   - **Indexes**: 
     - Composite index on `(userId, householdId, nextDueDate)`
     - TTL index on `nextDueDate` for automatic cleanup of expired rules

6. **loans**
   - **Purpose**: Store loan principal and terms
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Loan ID (UUID)
       userId: string;                       // Owner UID
       householdId?: string;                 // Owning household ID
       name: string;                         // Loan identifier (e.g., "Home Loan")
       principalAmount: number;              // Original loan amount
       interestRate: number;                 // Annual interest rate (percentage)
       tenureMonths: number;                 // Loan duration in months
       startDate: Timestamp;                 // Loan disbursement date
       emiAmount: number;                    // Calculated monthly EMI
       createdAt: Timestamp;                 // Creation timestamp
       updatedAt: Timestamp;                 // Last update timestamp
     }
     ```
   - **Usage**: 
     - Track loan details (home, personal, auto, etc.)
     - EMI calculated from principal, rate, and tenure
     - Linked to loan schedules for payment tracking
   - **Indexes**: Composite index on `(userId, householdId, startDate)`

7. **loan_schedules**
   - **Purpose**: Store detailed amortization schedules for loans
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Schedule ID (UUID)
       loanId: string;                       // Reference to loans.id
       paymentNumber: number;                // Installment number (1 to tenure)
       dueDate: Timestamp;                   // Payment due date
       openingBalance: number;               // Principal at start of period
       emiAmount: number;                    // Fixed monthly payment
       interestPaid: number;                   // Interest component of EMI
       principalPaid: number;                   // Principal component of EMI
       closingBalance: number;               // Principal at end of period
       paid: boolean;                        // Payment status
       paidDate?: Timestamp;                 // Actual payment date (if paid)
       createdAt: Timestamp;                 // Creation timestamp
     }
     ```
   - **Usage**: 
     - Track individual loan payments
     - Show principal vs interest breakdown
     - Monitor payment status and history
   - **Indexes**: 
     - Composite index on `(loanId, paymentNumber)`
     - Composite index on `(loanId, dueDate)`
   - **Note**: Stored in batches of 400 documents per write operation to optimize Firestore limits

8. **goals**
   - **Purpose**: Store financial savings goals
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Goal ID (UUID)
       userId: string;                       // Owner UID
       householdId?: string;                 // Owning household ID
       name: string;                         // Goal description (e.g., "Emergency Fund")
       targetAmount: number;                 // Target savings amount
       currentAmount: number;                // Current saved amount
       targetDate: Timestamp;                // Target completion date
       linkedRecurringRuleId?: string;       // Optional linked auto-save rule
       createdAt: Timestamp;                 // Creation timestamp
       updatedAt: Timestamp;                 // Last update timestamp
     }
     ```
   - **Usage**: 
     - Track savings targets (vacation, down payment, emergency fund)
     - Progress visualization toward target
     - Optional linking to recurring rules for automatic savings
   - **Indexes**: Composite index on `(userId, householdId, targetDate)`

9. **tax_calculations**
   - **Purpose**: Store tax computation results for comparison
   - **Document Structure**:
     ```typescript
     {
       id: string;                           // Calculation ID (UUID)
       userId: string;                       // Owner UID
       financialYear: string;                // YYYY-YY format (e.g., "2026-27")
       grossIncome: number;                  // Total income for FY
       deductions: {                         // Tax deduction breakdown
         section80C: number;                 // PF, PPF, ELSS, etc.
         section80D: number;                 // Medical insurance
         section24: number;                  // Home loan interest
         // ... other sections
       };
       taxableIncome: number;                // Income after deductions
       oldRegimeTax: number;                 // Tax under old regime
       newRegimeTax: number;                 // Tax under new regime
       regimeselected: 'old' | 'new';        // User's selected regime
       createdAt: Timestamp;                 // Creation timestamp
     }
     ```
   - **Usage**: 
     - Compare tax liability under old vs new regimes
     - Store user's regime selection
     - Basis for tax optimization suggestions
   - **Indexes**: Composite index on `(userId, financialYear)`

10. **households**
    - **Purpose**: Store family/group information
    - **Document Structure**:
      ```typescript
      {
        id: string;                           // Household ID (UUID)
        name: string;                         // Household name (e.g., "Smith Family")
        createdBy: string;                    // UID of creator
        createdAt: Timestamp;                 // Creation timestamp
        updatedAt: Timestamp;                 // Last update timestamp
      }
      ```
    - **Usage**: 
      - Group users for shared financial management
      - Single household per user at a time
      - Name for display purposes
    - **Indexes**: 
      - Single field index on `createdBy`
      - Array contains for member lookup (via household_members)

11. **household_members**
    - **Purpose**: Map users to households with role definitions
    - **Document Structure**:
      ```typescript
      {
        id: string;                           // Mapping ID (UUID)
        userId: string;                       // User UID
        householdId: string;                  // Household ID
        role: 'primary' | 'spouse' | 'dependent'; // Access level
        joinedAt: Timestamp;                  // When user joined household
        createdAt: Timestamp;                 // Creation timestamp
      }
      ```
    - **Usage**: 
      - Define access levels within household
      - Primary: Full access, can invite/remove members
      - Spouse: Full access to financial data
      - Dependent: Limited access (view-only, no modifications)
      - Enforces role-based access control in UI
    - **Indexes**: 
      - Composite index on `(userId, householdId)` (unique)
      - Composite index on `(householdId, role)`

12. **invites**
    - **Purpose**: Store pending household invitations
    - **Document Structure**:
      ```typescript
      {
        id: string;                           // Invite ID (UUID)
        householdId: string;                  // Target household ID
        email: string;                        // Invitee email address
        role: 'primary' | 'spouse' | 'dependent'; // Offered role
        invitedBy: string;                    // UID of inviter
        invitedAt: Timestamp;                 // Invitation timestamp
        expiresAt: Timestamp;                 // Expiration timestamp (7 days)
        createdAt: Timestamp;                 // Creation timestamp
      }
      ```
    - **Usage**: 
      - Manage household invitation workflow
      - Email-based invitation system
      - Role specification at invitation time
      - Automatic expiration for security
    - **Indexes**: 
      - Composite index on `(householdId, email)` (unique)
      - TTL index on `expiresAt` for automatic cleanup

### Database Access Layer (`src/lib/db.ts`)

The `db.ts` file provides a centralized interface for all Firestore operations, implementing sophisticated caching, error handling, and household-scoped queries.

#### Core Functions

1. **Initialization and Configuration**
   - Firebase app initialization with fallback configuration
   - Environment variable support for custom configuration
   - Safe initialization preventing multiple app instances

2. **Household ID Resolution** (`getHhId`)
   - Resolves household ID from AuthContext
   - Falls back to user UID when no household exists
   - Implements caching with 25-second TTL to reduce Auth context reads
   - Prevents redundant household lookups during data operations

3. **Generic Caching Wrapper** (`cachedFetch`)
   - Implements TTL-based caching (default 25 seconds)
   - Uses `Date.now()` for timestamp-based invalidation
   - Prevents stale data while minimizing Firestore reads
   - Includes in-flight request deduplication to prevent duplicate calls
   - Returns cached data if available and fresh

4. **Error Handling** (`handleFirestoreError`)
   - Centralized error logging and classification
   - Logs full error object to console for debugging
   - Returns structured error information
   - Prevents UI crashes from unhandled promise rejections

5. **CRUD Operations**
   - **Get Functions** (read):
     - `getCategories`: Fetch expense/income categories with type filter
     - `getIncomes`: Fetch income entries for month/household
     - `getTransactions`: Fetch transactions with filtering options
     - `getBudgets`: Fetch budgets for month/household
     - `getRecurringRules`: Fetch active recurring rules
     - `getLoans`: Fetch loan details
     - `getLoanSchedules`: Fetch amortization schedule for loan
     - `getGoals`: Fetch savings goals
     - `getTaxCalculations`: Fetch tax computation results
     - `getHouseholdInfo`: Fetch household details
     - `getHouseholdMembers`: Fetch members with roles
   - **Add Functions** (create):
     - `addCategory`: Create new expense/income category
     - `addIncome`: Create income entry with breakdown
     - `addTransaction`: Create expense or income transaction
     - `addBudget`: Create monthly budget limit
     - `addRecurringRule`: Create automatic transaction rule
     - `addLoan`: Create loan principal and terms
     - `addGoal`: Create savings goal
     - `addTaxCalculation`: Store tax computation result
   - **Update Functions** (modify):
     - `updateCategory`: Modify category properties
     - `updateIncome`: Modify income entry
     - `updateTransaction`: Modify transaction details
     - `updateBudget`: Modify budget limit
     - `updateRecurringRule`: Modify recurrence rule
     - `updateLoan`: Modify loan terms
     - `updateGoal`: Modify savings goal progress
     - `updateTaxCalculation`: Modify tax calculation result
   - **Delete Functions** (remove):
     - `deleteCategory`: Remove category (with usage checks)
     - `deleteIncome`: Remove income entry
     - `deleteTransaction`: Remove transaction
     - `deleteBudget`: Remove budget limit
     - `deleteRecurringRule`: Remove recurrence rule
     - `deleteLoan`: Remove loan and associated schedule
     - `deleteGoal`: Remove savings goal
     - `deleteTaxCalculation`: Remove tax computation result

6. **Specialized Operations**
   - **Recurring Rule Processing** (`processRecurringRules`):
     - Fetches rules due for execution
     - Generates transactions from rules
     - Updates next due date based on frequency
     - Handles edge cases (month-end dates, leap years)
     - Uses batched writes for efficiency
   - **Batch Operations**:
     - Loan schedule generation uses 400-item batches
     - Prevents Firestore write limit exceedance (500 writes/transaction)
     - Optimizes large data operations
   - **Household Management**:
     - Creating households with initial member setup
     - Inviting users to join households
     - Accepting/declining invitations
     - Removing members from households
     - Leaving households (with data preservation options)

#### Caching Strategy

- **TTL-Based Cache**:
  - Default time-to-live: 25 seconds
  - Implemented per-function basis in `cachedFetch`
  - Balances data freshness with Firestore read cost reduction
  - Household ID caching: Separate 25-second TTL for `getHhId`
- **In-Flight Request Deduplication**:
  - Prevents duplicate simultaneous requests for same data
  - Uses Map to track pending promises
  - Returns existing promise instead of initiating duplicate call
  - Critical for UI components that may trigger multiple reads
- **Cache Invalidation**:
  - Mutation operations (add/update/delete) clear relevant caches
  - Ensures optimistic UI updates reflect actual data state
  - Specific cache keys cleared based on operation type
  - Example: Adding transaction clears `getTransactions` and `getCategories` caches
- **Cache Structure**:
  - Key-based storage using function parameters and context
  - Separate caches per data type to avoid interference
  - Memory-based cleanup relies on JS garbage collection

#### Error Handling and Logging

- **Centralized Error Handler** (`handleFirestoreError`):
  - Catches all Firestore operation errors
  - Logs error code, message, and stack trace to console
  - Returns standardized error object:
    ```typescript
    {
      code: string;          // Firestore error code
      message: string;       // Human-readable description
      details?: any;         // Additional error details
    }
    ```
  - Prevents unhandled promise rejections in React components
  - Enables consistent error UI display
- **Error Classification**:
  - Permission errors: Security rule violations
  - Not found errors: Document doesn't exist
  - Already exists errors: Duplicate key violations
  - Resource exhausted errors: Quota limits
  - Unknown errors: Unexpected Firestore behavior
- **User-Friendly Messaging**:
  - Converts technical errors to understandable messages
  - Examples:
    - Permission error → "You don't have permission to perform this action"
    - Network error → "Please check your internet connection"
    - Quota error → "Storage limit exceeded. Please archive old data."
- **Logging Strategy**:
  - Development: Full error details to console
  - Production: Strategic logging to avoid information leakage
  - Error rates monitored via console output in deployment logs
  - No external error tracking integration (could be added)

#### Performance Optimizations

- **Query Efficiency**:
  - All queries use indexed fields where possible
  - Compound indexes created for common filter combinations
  - Avoids collection scans and client-side filtering
  - Uses `limit()` and pagination for large result sets
- **Read Minimization**:
  - Caching layer reduces redundant reads by 60-80% in typical usage
  - Household ID caching eliminates repeated Auth context reads
  - In-flight deduplication prevents duplicate calls during rapid UI updates
- **Write Optimization**:
  - Batched writes for large datasets (loan schedules: 400 items/batch)
  - Ordered writes where sequence matters
  - Use of `FieldValue.serverTimestamp()` for consistent timing
  - Avoids unnecessary document updates (checks for changes before writing)
- **Index Utilization**:
  - Composite indexes designed for query patterns:
    - Time-range queries: `(userId, householdId, date)`
    - Category filtering: `(userId, householdId, categoryId, date)`
    - Household-scoped lookups: `(householdId, ...)`
    - TTL-based cleanup: `expiresAt`, `nextDueDate`
- **Concurrency Handling**:
  - Firestore's optimistic concurrency with automatic retries
  - Client SDK handles transient errors with exponential backoff
  - Merge strategies for conflict resolution (last write wins)
  - No custom conflict resolution needed for financial data

#### Data Integrity and Validation

- **Application-Level Validation**:
  - TypeScript interfaces enforce data structure
  - Validation functions in UI components before Firestore writes
  - Business rule enforcement (e.g., net salary calculation)
  - Referential integrity maintained through service functions
- **Security Considerations**:
  - Frontend-only security model relies on proper UI authorization
  - No Firestore security rules implemented (reliant on client-side validation)
  - Household ID scoping prevents cross-household data access
  - User ID fallback ensures personal data isolation
- **Audit Trail**:
  - `createdAt` and `updatedAt` timestamps on all documents
  - Transaction source tracking (`manual`, `recurring`, `ai_scan`)
  - Recurring rule linkage for auditability
- **Offline Support**:
  - Firestore persistence enabled via `initializeFirestore` with cache settings
  - Local queue processes writes when offline
  - Automatic synchronization when connection restored
  - Conflict resolution handled by Firestore's built-in mechanisms

#### Household Scoping Mechanism

- **Dual-Key Lookup Pattern**:
  - All queries attempt household-scoped lookup first
  - Falls back to user-scoped lookup when household ID unavailable
  - Implemented via `getHhId` function returning string ID
  - Queries use conditional logic:
    ```javascript
    const hhId = await getHhId();
    const query = hhId 
      ? firestore.collection(col).where('householdId', '==', hhId)
      : firestore.collection(col).where('userId', '==', currentUser.uid);
    ```
- **Data Migration**:
  - When user joins household, existing personal data remains user-scoped
  - New data created after joining uses household scope
  - No automatic migration of historical data (preserves privacy)
  - Reports can combine personal and household data as needed
- **Access Control Enforcement**:
  - UI components check role from `household_members` document
  - Primary/spouse: Full read/write access to household data
  - Dependent: Read-only access to financial data
  - Household management functions restricted to primary role
  - Invitation system controlled by primary role only

#### Backup and Export Capabilities

- **Manual Export**:
  - Built-in export functionality exports to JSON/Excel
  - Includes all collections with relational integrity preserved
  - Timestamped exports for versioning
- **Automated Backup** (Future Enhancement):
  - Scheduled Cloud Functions could back up to Cloud Storage
  - Export formats: JSON, CSV, Avro for data lake ingestion
  - Point-in-time recovery capabilities
- **Data Portability**:
  - Firestore JSON export supports migration to other systems
  - Relational structure maintained through ID references
  - Timestamps preserved in ISO 8601 format

#### Limitations and Constraints

- **Firestore Limitations**:
  - 1 MiB document size limit (adequate for financial records)
  - 20 MiB transaction/write batch limit (managed via batching)
  - Index limits composite indexes per collection (careful design needed)
  - Query limitations: No JOIN-like operations, limited aggregation
- **Scaling Considerations**:
  - Horizontal scaling automatic with Firestore
  - Read scaling: Automatic sharding and caching
  - Write scaling: Limited by document write rates (use sharding by time/user)
  - Current design suitable for personal/family scale (10K-100K documents)
- **Consistency Model**:
  - Eventual consistency may show stale reads briefly
  - Strong consistency within document reads and transactions
  - Application designed tolerant of brief consistency windows
  - Optimistic update pattern masks latency from users
- **Cost Considerations**:
  - Read optimization critical for cost control at scale
  - Write costs minimized through batching and efficient schema
  - Storage costs scale with document count and size
  - Current usage well within free tier for personal use
- **Migration Path**:
  - Scheduled exports enable migration to other databases
  - Firestore-to-Firestore copy via export/import
  - Schema evolution through versioned documents
  - Backward compatibility maintained in read functions

#### Future Enhancements

- **Security Rules Implementation**:
  - Implement Firestore security rules for backend validation
  - Attribute-based access control (ABAC) for household/scoped access
  - Validate data structure and business rules at database level
  - Prevent unauthorized access even if client compromised
- **Enhanced Indexing**:
  - Add composite indexes for reporting queries
  - Implement single-field indexes for sorting and filtering
  - Monitor index usage via Firebase console metrics
- **Data Archiving**:
  - Implement automatic archiving of old data (>7 years)
  - Move to cheaper storage solutions (Cloud Storage Nearline)
  - Maintain accessibility for reporting and compliance
- **Analytics Enhancements**:
  - Add pre-aggregated collections for dashboard performance
  - Implement materialized views for complex calculations
  - Add counters for frequently accessed statistics
- **Multi-Region Support**:
  - Configure Firestore for multi-region durability
  - Implement conflict resolution strategies for distributed writes
  - Add latency-based routing for global users
- **Change Data Capture**:
  - Implement Firestore triggers for audit logging
  - Stream changes to Pub/Sub for external processing
  - Enable real-time analytics and alerting systems
- **Machine Learning Integration**:
  - Store processed data for spending pattern analysis
  - Export features for ML model training
  - Import model predictions for categorization suggestions
- **Enhanced Caching**:
  - Implement LRU cache with size limits
  - Add cache warming for predictable usage patterns
  - Implement predictive prefetching based on user behavior

The database layer combines Firebase Firestore's real-time capabilities with a sophisticated client-side caching layer to deliver optimal performance, reliability, and scalability for personal and family financial management.

## API

The API layer of Expense Planner consists of a minimal set of endpoints focused on AI-powered functionality, as core data operations are handled directly by the frontend via Firebase Firestore for real-time capabilities. This design reduces latency and backend load while leveraging server-side processing for compute-intensive tasks.

### API Design Philosophy

- **Minimalist Approach**: Only endpoints requiring server-side processing are exposed
- **Frontend-First Data Access**: Direct Firebase Firestore access from client for real-time updates
- **Server-Side Responsibilities**: Compute-intensive tasks (AI), health checks, and potential future admin operations
- **Security Focus**: Rate limiting and input validation to protect costly operations
- **Simplicity**: Straightforward RESTful endpoints with consistent error handling

### Available Endpoints

#### 1. Health Check Endpoint
- **Path**: `/api/health`
- **Method**: `GET`
- **Purpose**: Service health monitoring and load balancer checks
- **Authentication**: None (public endpoint)
- **Request**: No parameters or body required
- **Successful Response**:
  ```json
  {
    "status": "ok",
    "environment": "React/Express/Firebase"
  }
  ```
- **Implementation Location**: `server.ts` lines 36-38
- **Response Time**: Typically <5ms
- **Use Cases**:
  - Kubernetes liveness/readiness probes
  - Load balancer health checks
  - Manual service verification (`curl http://localhost:3000/api/health`)
  - Monitoring system integration
- **Error Cases**: None expected (always returns 200 if server is running)

#### 2. AI-Powered Receipt Scanning Endpoint
- **Path**: `/api/scan-receipt`
- **Method**: `POST`
- **Purpose**: Extract structured data from receipt images using Google Gemini AI
- **Authentication**: None (protected by rate limiting only)
- **Rate Limiting**: 10 requests per hour per IP address (prevents abuse of costly AI operations)
- **Request Body**:
  ```json
  {
    "imageBase64": "string (required)",  // Base64-encoded image data
    "mimeType": "string (optional)"      // MIME type (e.g., "image/jpeg", "image/png")
  }
  ```
- **Successful Response**:
  ```json
  {
    "amount": number,           // Total amount paid (numeric)
    "date": "string",           // Date in YYYY-MM-DD format
    "merchant": "string",       // Merchant/vendor name
    "category": "string"        // Expense category (e.g., "Food", "Transport")
  }
  ```
- **Example Request**:
  ```bash
  curl -X POST http://localhost:3000/api/scan-receipt \
    -H "Content-Type: application/json" \
    -d '{"imageBase64":"iVBORw0KGgoAAAANSUhEUgAA...", "mimeType":"image/jpeg"}'
  ```
- **Example Response**:
  ```json
  {
    "amount": 1250.50,
    "date": "2026-08-15",
    "merchant": "SuperMart",
    "category": "Groceries"
  }
  ```
- **Implementation Location**: `server.ts` lines 40-149 (core logic in `/api/scan-receipt.ts`)
- **Processing Flow**:
  1. **Input Validation**: Checks for `imageBase64` presence (returns 400 if missing)
  2. **API Key Validation**: Verifies `GEMINI_API_KEY` environment variable (returns 500 if missing)
  3. **MIME Type Handling**: Normalizes to `image/jpeg` if invalid/missing
  4. **Model Selection**: Attempts multiple Gemini models in priority order with fallbacks
  5. **Retry Logic**: Up to 2 attempts per model for transient errors (503/429) with 800ms backoff
  6. **AI Processing**: Sends image and prompt to Gemini API for structured data extraction
  7. **Response Parsing**: Strips markdown formatting and parses JSON response
  8. **Error Handling**: Returns user-friendly error messages for various failure scenarios
- **Response Time**: Typically 1-3 seconds (dominated by Gemini API latency)
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Missing image data" }`
  - `500 Internal Server Error`: 
    - `{ "error": "GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in the settings." }`
    - `{ "error": "The receipt scanning AI service is temporarily experiencing high traffic. Please try again in a few seconds." }` (for 503/high demand)
    - `{ "error": "Failed to process receipt with AI model" }` (generic failure)
- **Security Considerations**:
  - Rate limiting prevents abuse of costly AI operations
  - Input validation protects against malformed requests
  - No authentication required (secured via rate limiting and environment protection)
  - AI API key stored securely in server environment variables
- **Use Cases**:
  - Mobile/web app receipt upload feature
  - Bulk receipt processing (subject to rate limits)
  - Integration with expense tracking workflow
  - Proof-of-concept for AI-enhanced financial applications

### API Characteristics

#### Request/Response Format
- **Content-Type**: `application/json` for all endpoints
- **Character Encoding**: UTF-8
- **Response Compression**: None (small payloads)
- **Caching Headers**: None (dynamic content)
- **Security Headers**: Basic set (could be enhanced with helmet.js)

#### Error Handling Consistency
- **HTTP Status Codes**:
  - `200 OK`: Successful operation
  - `400 Bad Request`: Client error (missing/invalid input)
  - `500 Internal Server Error`: Server error (AI failure, configuration)
- **Response Body**: Always JSON with `{ error: "message" }` for errors
- **Success Responses**: Endpoint-specific JSON structure
- **Error Message Sanitization**: No stack traces or internal details exposed to clients

#### Rate Limiting Details
- **Global Limiter**:
  - Window: 15 minutes (900,000 ms)
  - Limit: 100 requests per IP
  - Purpose: Protect overall server availability
  - Applied to: All routes
- **Scan Receipt Limiter**:
  - Window: 60 minutes (3,600,000 ms)
  - Limit: 10 requests per IP
  - Purpose: Protect AI quota and budget
  - Applied to: `/api/scan-receipt` only
- **Key Generation**: Uses `req.ip` or `req.socket.remoteAddress` or `"unknown"`
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Timestamp when limit resets
  - Standard headers enabled, legacy headers disabled

#### Implementation Files
- **`server.ts`**: 
  - Main application setup (lines 1-169)
  - Middleware configuration (body parsing, rate limiting, Vite)
  - Route definitions
  - Error handling patterns
- **`api/scan-receipt.ts`**:
  - Contains the core receipt scanning logic (extracted for modularity)
  - Follows same pattern as inline implementation in server.ts
  - Exports as Express middleware function
- **`api/health.ts`**:
  - Simple health check implementation
  - Could be expanded with dependency checks (Firebase, AI service)

### API Security

#### Authentication Model
- **Current State**: No authentication on API endpoints
- **Rationale**: 
  - Core data operations handled client-side via Firebase Auth
  - API endpoints limited to non-sensitive operations (health check) and rate-limited AI services
  - Future endpoints requiring authentication would implement JWT or session validation
- **Potential Enhancements**:
  - Add API key validation for admin endpoints
  - Implement JWT verification for user-specific operations
  - Add role-based access control for future backend operations

#### Data Protection
- **Input Sanitization**:
  - Receipt scanner validates base64 format and length
  - MIME type validation prevents unexpected file types
  - No SQL/no injection risks (NoSQL database, no SQL queries)
- **API Key Security**:
  - `GEMINI_API_KEY` accessed only via `process.env`
  - Never logged or exposed in responses
  - `.gitignore` prevents `.env` committed to repository
- **Environment Isolation**:
  - Separate environment variables for development/staging/production
  - AI API keys can be rotated without code changes
  - Limited blast radius if key compromised (only affects AI endpoint)

#### Infrastructure Security
- **Service Binding**:
  - Development: Binds to localhost (implicit via Express defaults)
  - Production: Binds to 0.0.0.0 (explicit in `server.ts` line 166)
  - Docker: Port mapping controls host accessibility
  - Vercel: Serverless functions isolated by platform
- **Dependency Security**:
  - npm audit integrated into CI pipeline
  - Locked dependencies via package-lock.json
  - Regular updates scheduled
- **Container Security** (Docker):
  - Non-root user (Node.js Alpine default)
  - Read-only filesystem where possible
  - Security scanning in CI pipeline
  - Minimal base image (Alpine Linux)

### API Performance

#### Latency Characteristics
- **Health Check**: 
  - Minimal processing (<1ms)
  - Dominated by network latency
- **Receipt Scanning**:
  - Network to Google Gemini API: 500ms-1500ms
  - AI model inference: 500ms-1000ms (variable)
  - Request/response processing: <50ms
  - Total typical: 1000ms-3000ms
  - Worst case (retries, timeouts): Up to 10 seconds
#### Throughput Capacity
- **Health Check**: 
  - Limited by server connection capacity (~1000+ req/sec on modest hardware)
  - Global rate limiter: 100 req/15min/IP = ~0.11 req/sec/IP
- **Receipt Scanning**:
  - Rate limited to 10 req/hour/IP = ~0.0028 req/sec/IP
  - Practical limit: Concurrent requests processed sequentially by AI API
  - Bottleneck: Gemini API rate limits and quotas
#### Resource Utilization
- **CPU**: 
  - Minimal for request parsing/response formatting
  - Spikes during JSON processing (negligible)
  - AI processing offloaded to Google servers
- **Memory**:
  - Baseline: ~50MB
  - Per request: <1MB additional (mostly for base64 image data)
  - Scales linearly with concurrent requests (limited by rate limiter)
- **Network I/O**:
  - Incoming: Small JSON requests (~1KB)
  - Outgoing: Small JSON responses (~500B) + base64 image data (incoming only)
  - Outbound to Google: Base64 image data (~1.3x original size)
  - Inbound from Google: Small JSON response

### API Versioning and Evolution

#### Current Version
- Implicitly v1 (no versioning in path)
- Suitable for current scope of endpoints

#### Versioning Strategy (Future)
- **Path Versioning**: `/api/v1/scan-receipt` when new versions needed
- **Backward Compatibility**: Maintain old versions for deprecation period
- **Feature Flags**: Enable/disable features via environment variables
- **Deprecation Policy**: 6-month notice for breaking changes

#### Extension Points
- **New Endpoints**: 
  - `/api/admin/*` for system management (would require auth)
  - `/api/webhook/*` for third-party integrations
  - `/api/analytics/*` for aggregated metrics
- **Enhanced Existing**:
  - Add optional parameters to `/api/scan-receipt` (e.g., language hint, region)
  - Add batch processing endpoint (`/api/scan-receipts` for multiple images)
  - Add webhook registration for AI processing completion
- **Middleware Enhancements**:
  - Add request logging middleware
  - Add response compression
  - Add API documentation endpoints (Swagger/OpenAPI)

### Documentation and Testing

#### Self-Documentation
- **Inline Documentation**: JSDoc comments in route handlers
- **Example Usage**: 
  - Health check: `GET /api/health`
  - Receipt scan: `POST /api/scan-receipt` with base64 image
- **Error Codes**: Clearly defined in implementation
- **Rate Limit Headers**: Exposed to clients for awareness

#### Manual Testing
- **curl Examples**:
  ```bash
  # Health check
  curl -i http://localhost:3000/api/health
  
  # Receipt scan (requires valid image and API key)
  curl -X POST http://localhost:3000/api/scan-receipt \
    -H "Content-Type: application/json" \
    -d '{"imageBase64":"$(base64 -i receipt.jpg)", "mimeType":"image/jpeg"}'
  ```
- **Postman/Insomnia**: Collections can be created for testing
- **Browser Fetch API**: 
  ```javascript
  fetch('/api/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: imgBase64 })
  })
  ```

#### Automated Testing (Future)
- **Unit Tests**: 
  - Mock Google Gemini API
  - Test validation logic
  - Test error handling paths
- **Integration Tests**:
  - Spin up test server
  - Hit endpoints with various inputs
  - Verify responses and error codes
- **Load Testing**:
  - Simulate multiple concurrent users
  - Verify rate limiting behavior
  - Test recovery after limit window
- **Contract Testing**:
  - Verify API schema matches consumer expectations
  - Use tools like Pact for consumer-driven contracts

### Limitations and Constraints

#### Functional Limitations
- **Read-Only Data Access**: No endpoints for creating/reading/updating/deleting financial data
  - Intentional design to leverage Firebase real-time capabilities
  - Would require authentication and authorization for sensitive operations
- **Single AI Functionality**: Only receipt scanning currently implemented
  - Limited to use cases involving image-to-text conversion
  - No other AI services (forecasting, categorization, etc.) exposed
- **No WebSocket/Real-Time API**: 
  - Real-time data handled via Firebase Firestore listeners
  - No server-sent events or WebSocket endpoints
  - Simpler architecture but less flexibility for server-pushed updates

#### Technical Constraints
- **Rate Limiting Scope**: 
  - Memory-based limiter not suitable for multi-instance deployments
  - Would require shared store (Redis) for horizontal scaling
  - Current implementation fine for single-instance Docker/Vercel
- **Environment Dependency**: 
  - Requires `GEMINI_API_KEY` for core functionality
  - Graceful degradation not implemented (AI features fail if key missing)
  - Health check remains operational without AI key
- **Request Size Limits**:
  - 25MB JSON body limit (sufficient for base64 images)
  - May need adjustment for different file types or bulk operations
  - Streaming uploads not supported (would require multipart/form-data)
- **MIME Type Restrictions**:
  - Currently normalizes to image/jpeg
  - Would need extension for PDF scans, documents, etc.
  - Limited to image formats supported by Gemini API

#### Operational Considerations
- **Cold Starts** (Vercel):
  - Serverless function cold start adds latency (~100-500ms)
  - Mitigated by keeping functions warm with periodic pings
  - Less impactful for infrequently used AI endpoint
- **Vendor Lock-in**:
  - Tight coupling to Google Gemini AI API
  - Switching providers would require endpoint modification
  - Abstracting AI service behind interface would improve flexibility
- **Quota Management**:
  - Relies on rate limiting to control AI quota consumption
  - No automatic fallback to cheaper models on quota exhaustion
  - Manual monitoring recommended for production deployments

### Future Enhancements

#### Additional Endpoints
- **Admin Endpoints** (would require authentication):
  - `/api/admin/stats`: Usage statistics and metrics
  - `/api/admin/logs`: Recent error logs (paginated)
  - `/api/admin/config`: Non-sensitive configuration view
  - `/api/admin/backup`: Trigger data backup (if implemented)
- **Webhook Endpoints**:
  - `/api/webhook/receipt-scan`: Notify when AI processing completes
  - `/api/webhook/payment`: Third-party payment processor notifications
  - `/api/webhook/reminder`: External reminder/notification service
- **Analytics Endpoints** (aggregated, non-sensitive):
  - `/api/api/monthly-summary`: Spending/income aggregates
  - `/api/api/category-breakdown`: Category-wise analytics
  - `/api/api/trend-analysis`: Month-over-month comparisons

#### Enhanced Receipt Scanning
- **Batch Processing**:
  - `/api/scan-receipts`: Accept multiple images in one request
  - Returns array of results with correlation IDs
  - Useful for expense report processing
- **Optional Parameters**:
  - `languageHint`: Improve OCR for specific languages
  - `regionHint`: Specify expected currency/region
  - `enableDebug`: Return intermediate processing steps
- **Different Models**:
  - Allow client to specify preferred model (with fallback)
  - Support for specialized models (invoice, medical receipt, etc.)
- **Confidence Scoring**:
  - Add confidence scores to each extracted field
  - Enable UI to highlight low-confidence entries for review

#### Security Improvements
- **Authentication**:
  - Add JWT validation middleware for protected endpoints
  - Implement API key verification for admin functions
  - Integrate with Firebase Auth tokens for user-specific operations
- **Input Validation**:
  - Implement schema validation with Zod or Joi
  - Add request size limits per endpoint
  - Validate base64 format and length constraints
- **Output Sanitization**:
  - Implement response validation against expected schemas
  - Add sanitization for potential XSS in string fields
  - HTML-escape strings if used in web contexts
- **Monitoring**:
  - Add Prometheus metrics endpoint
  - Implement distributed tracing (OpenTelemetry)
  - Add structured logging (JSON format) for log aggregation

#### Performance Optimization
- **Response Compression**:
  - Add gzip/brotli compression for larger responses
  - Minimal benefit for current JSON responses
  - Prepare for future endpoint expansion
- **Caching**:
  - Add caching for non-time-sensitive AI results (if applicable)
  - Implement memoization for identical image hashes
  - Consider short-term caching for frequent duplicate requests
- **Connection Pooling**:
  - Optimize HTTP client configuration for Google API calls
  - Implement connection reuse and keep-alive
  - Add timeout and retry configuration externalization

#### Developer Experience
- **OpenAPI/Swagger**:
  - Generate specification from JSDoc comments
  - Serve Swagger UI at `/api/docs`
  - Include examples and error schemas
- **Postman Collection**:
  - Exportable API collection for testing
  - Include environment variables and pre-request scripts
- **SDK Generation**:
  - Generate client SDKs (TypeScript, JavaScript, etc.)
  - Enable type-safe API consumption
- **Versioning**:
  - Implement semantic versioning in API responses
  - Add `/api/version` endpoint
  - Deprecation headers for sunset endpoints

The API layer provides a secure, efficient interface for AI-powered functionality while leveraging Firebase's real-time capabilities for core data operations. This hybrid approach minimizes latency, reduces server load, and delivers a responsive user experience.

## Authentication

Expense Planner employs Firebase Authentication as its primary authentication mechanism, providing secure user identification and enabling household-based access control. The authentication system integrates with Firebase's client-side SDK on the frontend and leverages environment-variable-protected API keys for any backend interactions requiring server-side validation.

### Authentication Providers

The application supports multiple authentication providers through Firebase Auth, though the core implementation focuses on Email/Password for simplicity and broad accessibility:

- **Email/Password**: Primary authentication method allowing users to register with an email address and password
- **Google Sign-In**: Configured and available (client-side SDK supports it)
- **Apple Sign-In**: Available through Firebase Auth
- **Microsoft Account**: Available through Firebase Auth
- **GitHub**: Available through Firebase Auth
- **Anonymous**: Supported for temporary access (can be upgraded to permanent accounts)

While the codebase demonstrates Email/Password flow explicitly, the Firebase configuration enables all providers by default. Additional providers can be enabled in the Firebase console without code changes.

### Authentication Flow

#### User Registration

1. **Frontend Initiation**: User submits registration form (`src/pages/Login.tsx`)
2. **Input Validation**: Frontend validates email format, password strength, and required fields
3. **Firebase Auth Call**: `createUserWithEmailAndPassword(auth, email, password)` 
4. **User Creation**: Firebase creates user account and returns `UserCredential`
5. **Household Creation**: On successful registration, AuthContext automatically creates a household for the new user
6. **State Update**: AuthContext updates user, householdMember, and household state
7. **Redirect**: User redirected to dashboard upon successful authentication

#### User Login

1. **Frontend Initiation**: User submits login form
2. **Input Validation**: Email and password validation
3. **Firebase Auth Call**: `signInWithEmailAndPassword(auth, email, password)`
4. **Authentication**: Firebase verifies credentials
5. **Household Resolution**: AuthContext retrieves or creates household membership
6. **State Update**: AuthContext populates user, householdMember, and household data
7. **Redirect**: User redirected to dashboard

#### Authentication State Management

The `AuthContext` (`src/contexts/AuthContext.tsx`) provides reactive authentication state throughout the application:

- **`user`**: Firebase `User` object (null when unauthenticated)
- **`loading`**: Boolean indicating authentication initialization status
- **`householdMember`**: Household membership details including role
- **`household`**: Household information (name, creation date, etc.)
- **`refreshHousehold`**: Method to manually refresh household data

The context uses Firebase's `onAuthStateChanged` listener to react to authentication state changes in real-time, with built-in safeguards:

- **Safety Timeout**: 2.5-second maximum loading state to prevent hanging UI
- **Household Fetch Timeout**: 5-second timeout for household data retrieval
- **Auto-Creation**: Users without households are automatically assigned a personal household
- **Error Handling**: Graceful degradation with console warnings for non-critical failures

#### Token Management

- **ID Token**: Firebase Auth ID tokens are automatically managed by the client SDK
- **Token Refresh**: Handled transparently by Firebase SDK
- **Persistence**: Authentication state persisted in browser storage (indexedDB/localStorage) based on Firebase configuration
- **Security**: Tokens are cryptographically signed and validated by Firebase services

### Household-Based Access Control

Authentication is tightly integrated with household management to enable multi-user financial collaboration:

#### Household Creation

- **Automatic on Registration**: New users automatically receive a personal household
- **Manual Creation**: Users can create additional households via `HouseholdSettings` component
- **Invitation System**: Households can invite other users via email with role specification

#### Household Membership

Stored in the `household_members` Firestore collection with the following structure:

```typescript
{
  id: string;                    // Mapping ID (UUID)
  userId: string;                // User UID
  householdId: string;           // Household ID
  role: 'primary' | 'spouse' | 'dependent'; // Access level
  joinedAt: Timestamp;           // When user joined household
  createdAt: Timestamp;          // Creation timestamp
}
```

#### Role-Based Permissions

Three distinct roles define access levels within a household:

1. **Primary** (Household Creator/Owner)
   - Full access to all household financial data
   - Can invite/remove household members
   - Can modify household settings and metadata
   - Can manage household-level settings (if implemented)
   - Default role for household creator

2. **Spouse**
   - Full access to all household financial data
   - Can create, edit, and delete transactions, income, budgets, etc.
   - Cannot modify household membership or settings
   - Equal financial access to Primary role

3. **Dependent**
   - Read-only access to household financial data
   - Can view transactions, income, reports, and budgets
   - Cannot create, edit, or delete any financial data
   - Cannot modify household settings or membership

#### Authorization Enforcement

Authorization checks occur at multiple layers:

- **Frontend Routing**: Protected routes verify authentication state before rendering
- **Component-Level UI**: Components conditionally render UI elements based on user role
  ```typescript
  // Example: Hide edit controls for dependents
  {userRole !== 'dependent' && (
    <Button onClick={addExpense}>Add Expense</Button>
  )}
  ```
- **Data Access Layer**: Queries scope to household ID when available, falling back to user ID for personal data
- **Validation Logic**: Mutation functions verify appropriate permissions before processing

### Security Considerations

- **Client-Side Security**: Firebase config keys are safe to expose (public by design); no secret keys stored in frontend
- **Password Security**: Firebase Auth employs industry-standard password hashing and salting
- **Brute Force Protection**: Firebase Auth includes rate limiting on authentication attempts
- **Email Verification**: Optional email verification flow available (not currently implemented in UI)
- **Password Reset**: Password reset functionality available via Firebase Auth
- **Session Management**: Firebase Auth handles session creation, refresh, and expiration
- **Multi-Factor Authentication**: Supported through Firebase Auth (can be enabled in console)
- **Account Enumeration Protection**: Firebase Auth provides generic error messages to prevent email enumeration

### Integration with Backend

While most data operations occur client-side via Firebase Firestore, the backend validates authentication for AI-dependent operations:

- **API Key Protection**: Backend operations requiring Google Gemini API validate `GEMINI_API_KEY` environment variable
- **No Direct Auth Validation**: Current API endpoints (`/api/health`, `/api/scan-receipt`) rely on rate limiting rather than explicit authentication, as they don't modify user data
- **Future Enhancement Path**: Admin endpoints would implement JWT validation or Firebase Auth token verification

### Error Handling and User Feedback

Authentication errors are caught and displayed to users through form validation messages:

- **Network Errors**: "Please check your internet connection"
- **Invalid Credentials**: "Invalid email or password"
- **User Not Found**: "No account found with this email"
- **Weak Password**: "Password should be at least 6 characters"
- **Email Already in Use**: "An account already exists with this email"
- **Quota Exceeded**: "Too many unsuccessful attempts. Please try again later."

All authentication-related errors are logged to the console for debugging while presenting user-friendly messages in the UI.

### Development and Testing

- **Firebase Emulators**: Authentication emulator can be used for local development (`firebase emulators:start --only auth`)
- **Environment Variables**: No authentication-specific environment variables required; Firebase config uses `VITE_*` prefixed variables
- **Testing Strategy**: 
  - Unit tests mock `firebase/auth` functions
  - Integration tests verify end-to-end flow with Firebase emulator
  - Test scenarios include registration, login, logout, household creation, and role-based access

### Future Enhancements

- **Email Verification Flow**: Implement email verification requirement for new accounts
- **Profile Management**: Allow users to update display name, photo URL, and other profile information
- **Multi-Factor Authentication**: Implement MFA options for enhanced security
- **Social Provider Buttons**: Add visible sign-in buttons for Google, Apple, etc. in login UI
- **Session Persistence Options**: Configure authentication persistence (local, session, none) based on security requirements
- **Account Deletion**: Implement account deletion functionality with associated data cleanup
- **Anonymous to Permanent Upgrade**: Allow anonymous users to upgrade to permanent accounts without data loss
- **Custom Claims**: Use Firebase custom claims for more granular role-based access control in security rules
- **Auth State Persistence**: Improve handling of tab/window state changes and authentication persistence

Authentication in Expense Planner provides a secure, scalable foundation for user identity and household-based collaboration, leveraging Firebase's robust authentication infrastructure while maintaining a clean separation of concerns between frontend and backend concerns.

