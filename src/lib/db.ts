import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { getHouseholdMembership } from "./db_household";
import { 
  IncomeEntry, 
  Transaction, 
  Category, 
  DEFAULT_CATEGORIES, 
  Budget, 
  RecurringRule, 
  Loan, 
  LoanSchedule, 
  Goal, 
  TaxCalculation 
} from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function getHhId(userId: string): Promise<string | undefined> {
  try {
    const member = await getHouseholdMembership(userId);
    return member?.household_id;
  } catch (e) {
    console.warn("Could not fetch household membership for user", userId, e);
    return undefined;
  }
}

// --- Categories ---
export async function getCategories(userId: string): Promise<Category[]> {
  try {
    const q = query(
      collection(db, "categories"),
      where("user_id", "in", [userId, "system"])
    );
    
    const snapshot = await getDocs(q);
    const userCategories = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    
    // Combine defaults and custom
    const allCategories = [...DEFAULT_CATEGORIES, ...userCategories];
    const unique = Array.from(new Map(allCategories.map(c => [c.name, c])).values());
    return unique;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "categories");
    return DEFAULT_CATEGORIES;
  }
}

export async function addCategory(category: Omit<Category, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "categories"), category);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "categories");
    return "";
  }
}

// --- Income ---
export async function getIncomes(userId: string, month: string): Promise<IncomeEntry[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "income_entries"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId),
      where("month", "==", month)
    );
    
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as IncomeEntry));
    return items.sort((a, b) => {
      const getMs = (val: any) => {
        if (!val) return 0;
        if (typeof val.toMillis === "function") return val.toMillis();
        if (typeof val.getTime === "function") return val.getTime();
        if (typeof val.seconds === "number") return val.seconds * 1000;
        return 0;
      };
      return getMs(b.created_at) - getMs(a.created_at);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "income_entries");
    return [];
  }
}

export async function addIncome(income: Omit<IncomeEntry, "id" | "created_at">): Promise<string> {
  try {
    const hhId = await getHhId(income.user_id);
    const payload = {
      ...income,
      ...(hhId ? { household_id: hhId } : {}),
      created_at: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, "income_entries"), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "income_entries");
    return "";
  }
}

export async function updateIncome(id: string, updates: Partial<IncomeEntry>): Promise<void> {
  try {
    const docRef = doc(db, "income_entries", id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `income_entries/${id}`);
  }
}

export async function deleteIncome(id: string): Promise<void> {
  try {
    const docRef = doc(db, "income_entries", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `income_entries/${id}`);
  }
}

// --- Transactions ---
export async function getTransactions(userId: string, monthPrefix: string): Promise<Transaction[]> {
  try {
    const hhId = await getHhId(userId);
    const startDate = `${monthPrefix}-01`;
    const endDate = `${monthPrefix}-31`;

    const q = query(
      collection(db, "transactions"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    return data.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "transactions");
    return [];
  }
}

export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">): Promise<string> {
  try {
    const hhId = await getHhId(transaction.user_id);
    const payload = {
      ...transaction,
      ...(hhId ? { household_id: hhId } : {}),
      created_at: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, "transactions"), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "transactions");
    return "";
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  try {
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const docRef = doc(db, "transactions", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
  }
}

// --- Budgets ---
export async function getBudgets(userId: string, month: string): Promise<Budget[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "budgets"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId),
      where("month", "==", month)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "budgets");
    return [];
  }
}

export async function setBudget(budget: Omit<Budget, "id" | "created_at">): Promise<void> {
  try {
    const hhId = await getHhId(budget.user_id);
    const budgetData = {
      ...budget,
      ...(hhId ? { household_id: hhId } : {})
    };
    
    const q = query(
      collection(db, "budgets"),
      where(hhId ? "household_id" : "user_id", "==", hhId || budget.user_id),
      where("category_id", "==", budget.category_id),
      where("month", "==", budget.month)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(collection(db, "budgets"), {
        ...budgetData,
        created_at: Timestamp.now()
      });
    } else {
      const docRef = doc(db, "budgets", snapshot.docs[0].id);
      await updateDoc(docRef, { limit_amount: budget.limit_amount });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "budgets");
  }
}

export async function cloneBudgets(userId: string, fromMonth: string, toMonth: string): Promise<void> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "budgets"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId),
      where("month", "==", fromMonth)
    );
    const snapshot = await getDocs(q);
    const fromBudgets = snapshot.docs.map(d => d.data() as Budget);

    for (const b of fromBudgets) {
      await setBudget({
        user_id: userId,
        category_id: b.category_id,
        month: toMonth,
        limit_amount: b.limit_amount
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "budgets");
  }
}

// --- Recurring Rules ---
export async function getRecurringRules(userId: string): Promise<RecurringRule[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "recurring_rules"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecurringRule)).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "recurring_rules");
    return [];
  }
}

export async function addRecurringRule(rule: Omit<RecurringRule, "id" | "created_at">): Promise<string> {
  try {
    const hhId = await getHhId(rule.user_id);
    const docRef = await addDoc(collection(db, "recurring_rules"), {
      ...rule,
      ...(hhId ? { household_id: hhId } : {}),
      created_at: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "recurring_rules");
    return "";
  }
}

export async function updateRecurringRule(id: string, updates: Partial<RecurringRule>): Promise<void> {
  try {
    const docRef = doc(db, "recurring_rules", id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `recurring_rules/${id}`);
  }
}

export async function deleteRecurringRule(id: string): Promise<void> {
  try {
    const docRef = doc(db, "recurring_rules", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `recurring_rules/${id}`);
  }
}

export async function processRecurringRules(userId: string): Promise<number> {
  try {
    const hhId = await getHhId(userId);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    const q = query(
      collection(db, "recurring_rules"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId),
      where("active", "==", true),
      where("next_due_date", "<=", today)
    );
    const snapshot = await getDocs(q);
    
    let processedCount = 0;
    for (const document of snapshot.docs) {
      const rule = { id: document.id, ...document.data() } as RecurringRule;
      
      // Create transaction
      await addTransaction({
        user_id: userId,
        category_id: rule.category_id,
        amount: rule.amount,
        date: rule.next_due_date,
        note: rule.label,
        payment_mode: "UPI",
        source: "recurring"
      });
      
      // Calculate next due date
      const currentDue = new Date(rule.next_due_date);
      if (rule.frequency === "monthly") {
        currentDue.setMonth(currentDue.getMonth() + 1);
      } else if (rule.frequency === "quarterly") {
        currentDue.setMonth(currentDue.getMonth() + 3);
      } else if (rule.frequency === "yearly") {
        currentDue.setFullYear(currentDue.getFullYear() + 1);
      }
      const nextDueDateStr = currentDue.toISOString().split("T")[0];
      
      // Update rule
      await updateRecurringRule(rule.id!, { next_due_date: nextDueDateStr });
      processedCount++;
    }
    
    return processedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "recurring_rules");
    return 0;
  }
}

// --- Loans & Amortization ---
export async function getLoans(userId: string): Promise<Loan[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "loans"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Loan));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "loans");
    return [];
  }
}

export async function addLoan(loan: Omit<Loan, "id" | "created_at">): Promise<string> {
  try {
    const hhId = await getHhId(loan.user_id);
    const docRef = await addDoc(collection(db, "loans"), {
      ...loan,
      ...(hhId ? { household_id: hhId } : {}),
      created_at: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "loans");
    return "";
  }
}

export async function getLoanSchedule(loanId: string, userId: string): Promise<LoanSchedule[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "loan_schedules"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId),
      where("loan_id", "==", loanId)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanSchedule));
    return items.sort((a, b) => a.month_number - b.month_number);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "loan_schedules");
    return [];
  }
}

export async function saveLoanSchedule(schedule: LoanSchedule[]): Promise<void> {
  if (schedule.length === 0) return;
  try {
    const hhId = await getHhId(schedule[0].user_id);
    const enrichedSchedule = schedule.map(s => ({
      ...s,
      ...(hhId ? { household_id: hhId } : {})
    }));
    
    for (let i = 0; i < enrichedSchedule.length; i += 400) {
      const chunk = enrichedSchedule.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(collection(db, "loan_schedules"));
        batch.set(docRef, item);
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "loan_schedules");
  }
}

export async function clearLoanSchedule(loanId: string, userId: string): Promise<void> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "loan_schedules"),
      where("loan_id", "==", loanId),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId)
    );
    const snapshot = await getDocs(q);
    
    for (let i = 0; i < snapshot.docs.length; i += 400) {
      const chunk = snapshot.docs.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const docSnapshot of chunk) {
        batch.delete(docSnapshot.ref);
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, "loan_schedules");
  }
}

// --- Savings Goals ---
export async function getGoals(userId: string): Promise<Goal[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "goals"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "goals");
    return [];
  }
}

export async function addGoal(goal: Omit<Goal, "id" | "created_at">): Promise<string> {
  try {
    const hhId = await getHhId(goal.user_id);
    const docRef = await addDoc(collection(db, "goals"), {
      ...goal,
      ...(hhId ? { household_id: hhId } : {}),
      created_at: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "goals");
    return "";
  }
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
  try {
    const docRef = doc(db, "goals", id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `goals/${id}`);
  }
}

export async function deleteGoal(id: string): Promise<void> {
  try {
    const docRef = doc(db, "goals", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `goals/${id}`);
  }
}

// --- Tax Calculations ---
export async function getTaxCalculations(userId: string): Promise<TaxCalculation[]> {
  try {
    const hhId = await getHhId(userId);
    const q = query(
      collection(db, "tax_calculations"),
      where(hhId ? "household_id" : "user_id", "==", hhId || userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaxCalculation));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "tax_calculations");
    return [];
  }
}

export async function saveTaxCalculation(taxCalc: Omit<TaxCalculation, "id" | "created_at">): Promise<string> {
  try {
    const hhId = await getHhId(taxCalc.user_id);
    const payload = {
      ...taxCalc,
      ...(hhId ? { household_id: hhId } : {}),
      created_at: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, "tax_calculations"), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "tax_calculations");
    return "";
  }
}

export async function deleteTaxCalculation(id: string): Promise<void> {
  try {
    const docRef = doc(db, "tax_calculations", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tax_calculations/${id}`);
  }
}
