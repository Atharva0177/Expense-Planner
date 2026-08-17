# TASKS

## Phase 0 — Foundation
- [x] Monorepo scaffold (Adapted to React + Vite + Express + Firebase due to quota/environment constraints).
- [x] Firebase Firestore & Auth provisioned (Schema defined in `firebase-blueprint.json`).
- [x] Single-user auth: email + password (implemented via Firebase Auth).
- [x] Health check endpoint (`/api/health`) returning server status.
- [x] Proof of work: server running, curl to `/api/health` returning 200, screenshot of a working login page.
**Status**: DONE

## Phase 1 — Income & Expense CRUD
- [x] Income entry: salary components.
- [x] Expense entry: amount, category, date, note.
- [x] Fixed category list tailored to Indian spend.
- [x] Full CRUD on both, list views with filter by month and category.
**Status**: DONE

## Phase 2 — Budgets & Recurring Transactions
- [x] Monthly budget per category.
- [x] Recurring transaction definitions.
- [x] Budget vs actual view per category for the current month.
**Status**: DONE

## Phase 3 — Loans & EMI Tracker
- [x] Loan entry (principal, interest rate, tenure).
- [x] Amortization schedule generation.
- [x] Prepayment entry.
**Status**: DONE

## Phase 4 — Savings Goals
- [x] Goal entry (target amount, date).
- [x] Progress view.
**Status**: DONE

## Phase 5 — Tax Regime Calculator
- [x] Input: annual CTC breakdown, 80C, 80D, home loan interest.
- [x] Output: tax payable old vs new (FY 2025-26 slabs).
**Status**: DONE

## Phase 6 — Dashboard & Reports
- [x] Monthly overview: income vs expense pie/bar chart.
- [x] Trend view: last 6 months.
- [x] CSV export.
- [x] CSV import queue.
**Status**: DONE

## Phase 7 — Polish & Deploy
- [x] Responsive pass.
- [x] Error states, empty states.
**Status**: DONE
