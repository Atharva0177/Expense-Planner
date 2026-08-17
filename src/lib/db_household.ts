import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  Household, 
  HouseholdMember, 
  Invite, 
  InvestmentAccount, 
  InvestmentHolding, 
  InvestmentValuation 
} from "../types";
import { handleFirestoreError, OperationType, clearCache } from "./db";

const householdCache = new Map<string, { data: any; time: number }>();
const householdInFlight = new Map<string, Promise<any>>();

async function cachedHhFetch<T>(key: string, fetcher: () => Promise<T>, ttl = 30000): Promise<T> {
  const cached = householdCache.get(key);
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data as T;
  }
  if (householdInFlight.has(key)) {
    return householdInFlight.get(key) as Promise<T>;
  }
  const promise = fetcher().then((res) => {
    householdCache.set(key, { data: res, time: Date.now() });
    householdInFlight.delete(key);
    return res;
  }).catch((err) => {
    householdInFlight.delete(key);
    throw err;
  });
  householdInFlight.set(key, promise);
  return promise;
}

export function clearHouseholdCache(prefix?: string) {
  if (!prefix) {
    householdCache.clear();
    return;
  }
  for (const k of Array.from(householdCache.keys())) {
    if (k.startsWith(prefix)) {
      householdCache.delete(k);
    }
  }
}

export async function createHousehold(userId: string, name: string, email: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "households"), {
      name,
      created_by: userId,
      created_at: Timestamp.now()
    });
    
    await addDoc(collection(db, "household_members"), {
      household_id: docRef.id,
      user_id: userId,
      email,
      role: "primary",
      joined_at: Timestamp.now()
    });
    
    clearHouseholdCache();
    clearCache();
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "households");
    return "";
  }
}

export async function getHouseholdMembership(userId: string): Promise<HouseholdMember | null> {
  return cachedHhFetch(`member_${userId}`, async () => {
    try {
      const q = query(
        collection(db, "household_members"),
        where("user_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as HouseholdMember;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "household_members");
      return null;
    }
  });
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  return cachedHhFetch(`hh_${householdId}`, async () => {
    try {
      const docSnap = await getDoc(doc(db, "households", householdId));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Household;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `households/${householdId}`);
      return null;
    }
  });
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  return cachedHhFetch(`members_list_${householdId}`, async () => {
    try {
      const q = query(
        collection(db, "household_members"),
        where("household_id", "==", householdId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HouseholdMember));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "household_members");
      return [];
    }
  });
}

export async function createInvite(householdId: string, email: string, role: string): Promise<string> {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await addDoc(collection(db, "invites"), {
      household_id: householdId,
      email,
      invite_code: inviteCode,
      role,
      status: "pending",
      expires_at: Timestamp.fromDate(expiresAt),
      created_at: Timestamp.now()
    });
    
    return inviteCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "invites");
    return "";
  }
}

export async function checkAndAcceptInvite(userId: string, email: string, inviteCode: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "invites"),
      where("invite_code", "==", inviteCode),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    
    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data() as Invite;
    
    // Create membership
    await addDoc(collection(db, "household_members"), {
      household_id: inviteData.household_id,
      user_id: userId,
      email: email || inviteData.email,
      role: inviteData.role || "dependent",
      joined_at: Timestamp.now()
    });
    
    // Mark accepted
    await updateDoc(doc(db, "invites", inviteDoc.id), { status: "accepted" });
    clearHouseholdCache();
    clearCache();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "invites");
    return false;
  }
}

export async function updateMemberRole(memberId: string, role: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, "household_members", memberId), { role });
    clearHouseholdCache();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `household_members/${memberId}`);
    return false;
  }
}

// Investments
export async function getInvestmentAccounts(householdId: string): Promise<InvestmentAccount[]> {
  return cachedHhFetch(`invest_accounts_${householdId}`, async () => {
    try {
      const q = query(
        collection(db, "investment_accounts"),
        where("household_id", "==", householdId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InvestmentAccount));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "investment_accounts");
      return [];
    }
  });
}

export async function addInvestmentAccount(account: Omit<InvestmentAccount, "id" | "created_at">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "investment_accounts"), {
      ...account,
      created_at: Timestamp.now()
    });
    clearHouseholdCache("invest_accounts");
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "investment_accounts");
    return "";
  }
}

export async function getInvestmentHoldings(accountId: string): Promise<InvestmentHolding[]> {
  return cachedHhFetch(`invest_holdings_${accountId}`, async () => {
    try {
      const q = query(
        collection(db, "investment_holdings"),
        where("investment_account_id", "==", accountId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InvestmentHolding));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "investment_holdings");
      return [];
    }
  });
}

export async function addInvestmentHolding(holding: Omit<InvestmentHolding, "id" | "created_at">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "investment_holdings"), {
      ...holding,
      created_at: Timestamp.now()
    });
    clearHouseholdCache("invest_holdings");
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "investment_holdings");
    return "";
  }
}

export async function getLatestValuation(accountId: string): Promise<InvestmentValuation | null> {
  return cachedHhFetch(`invest_val_${accountId}`, async () => {
    try {
      const q = query(
        collection(db, "investment_valuations"),
        where("investment_account_id", "==", accountId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InvestmentValuation));
      list.sort((a, b) => b.date.localeCompare(a.date));
      return list[0] || null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "investment_valuations");
      return null;
    }
  });
}

export async function addInvestmentValuation(valuation: Omit<InvestmentValuation, "id" | "created_at">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "investment_valuations"), {
      ...valuation,
      created_at: Timestamp.now()
    });
    clearHouseholdCache("invest_val");
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "investment_valuations");
    return "";
  }
}
