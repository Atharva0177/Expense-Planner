import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Household,
  HouseholdMember,
  Invite,
  InvestmentAccount,
  InvestmentHolding,
  InvestmentValuation,
} from "../types";
import { handleFirestoreError, OperationType, clearCache } from "./db";

const householdCache = new Map<string, { data: any; time: number }>();
const householdInFlight = new Map<string, Promise<any>>();

async function cachedHhFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 30000,
): Promise<T> {
  const cached = householdCache.get(key);
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data as T;
  }
  if (householdInFlight.has(key)) {
    return householdInFlight.get(key) as Promise<T>;
  }
  const promise = fetcher()
    .then((res) => {
      householdCache.set(key, { data: res, time: Date.now() });
      householdInFlight.delete(key);
      return res;
    })
    .catch((err) => {
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

export async function createHousehold(
  userId: string,
  name: string,
  email: string,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "households"), {
      name,
      created_by: userId,
      created_at: Timestamp.now(),
    });

    // Remove any legacy membership rows FIRST - the anchor below is the
    // single source of truth (updating legacy rows alongside the anchor
    // makes the same member appear twice in the family list)
    await removeLegacyMembershipRows(userId);

    // Write the deterministic membership anchor (household_members/{uid}) -
    // the Firestore security rules use this path to verify household access.
    await setDoc(
      doc(db, "household_members", userId),
      {
        household_id: docRef.id,
        user_id: userId,
        email,
        role: "primary",
        joined_at: Timestamp.now(),
      },
      { merge: true },
    );

    clearHouseholdCache();
    clearCache();
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "households");
    return "";
  }
}

export async function updateHouseholdName(
  householdId: string,
  name: string,
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "households", householdId), { name });
    clearHouseholdCache();
    return true;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `households/${householdId}`,
    );
    return false;
  }
}

export async function leaveHousehold(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "household_members"),
      where("user_id", "==", userId),
    );
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "household_members", d.id));
    }
    // Also clear the deterministic anchor doc (security rules read this path)
    await deleteDoc(doc(db, "household_members", userId));
    clearHouseholdCache();
    clearCache();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, "household_members");
    return false;
  }
}

/**
 * Removes duplicate/legacy membership rows (household_members docs whose id
 * is an auto-ID instead of the user's uid). The deterministic anchor
 * (household_members/{uid}) is the single source of truth; leaving legacy
 * rows in place makes the family member list show the same person twice.
 * Best-effort: never throws (rule- or network failures are logged and
 * skipped - the anchor write remains authoritative).
 */
async function removeLegacyMembershipRows(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, "household_members"),
      where("user_id", "==", userId),
    );
    const snapshot = await getDocs(q);
    const duplicates = snapshot.docs.filter((d) => d.id !== userId);
    for (const dup of duplicates) {
      try {
        await deleteDoc(doc(db, "household_members", dup.id));
      } catch (e) {
        console.warn("Legacy membership cleanup skipped for doc", dup.id, e);
      }
    }
  } catch (e) {
    console.warn("Legacy membership cleanup failed", e);
  }
}

export async function getHouseholdMembership(
  userId: string,
): Promise<HouseholdMember | null> {
  return cachedHhFetch(`member_${userId}`, async () => {
    try {
      const q = query(
        collection(db, "household_members"),
        where("user_id", "==", userId),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      // Self-heal dedup: if the anchor doc exists alongside legacy rows,
      // delete the legacy rows so the member list shows each person once.
      const anchorDoc = snapshot.docs.find((d) => d.id === userId);
      if (anchorDoc) {
        const duplicates = snapshot.docs.filter((d) => d.id !== userId);
        if (duplicates.length > 0) {
          for (const dup of duplicates) {
            try {
              await deleteDoc(doc(db, "household_members", dup.id));
            } catch (e) {
              console.warn("Duplicate membership cleanup skipped", e);
            }
          }
        }
        return { id: anchorDoc.id, ...anchorDoc.data() } as HouseholdMember;
      }
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as HouseholdMember;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "household_members");
      return null;
    }
  });
}

export async function getHousehold(
  householdId: string,
): Promise<Household | null> {
  return cachedHhFetch(`hh_${householdId}`, async () => {
    try {
      const docSnap = await getDoc(doc(db, "households", householdId));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Household;
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `households/${householdId}`,
      );
      return null;
    }
  });
}

export async function getHouseholdMembers(
  householdId: string,
): Promise<HouseholdMember[]> {
  return cachedHhFetch(`members_list_${householdId}`, async () => {
    try {
      const q = query(
        collection(db, "household_members"),
        where("household_id", "==", householdId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as HouseholdMember,
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "household_members");
      return [];
    }
  });
}

export async function createInvite(
  householdId: string,
  email: string,
  role: string,
  custom_role_description?: string,
): Promise<string> {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Deterministic doc id = invite code, so the security rules can verify a
    // pending invite by path during household join (no queries in rules).
    await setDoc(doc(db, "invites", inviteCode), {
      household_id: householdId,
      email,
      invite_code: inviteCode,
      role,
      custom_role_description: custom_role_description || null,
      status: "pending",
      expires_at: Timestamp.fromDate(expiresAt),
      created_at: Timestamp.now(),
    });

    return inviteCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "invites");
    return "";
  }
}

export async function checkAndAcceptInvite(
  userId: string,
  email: string,
  inviteCode: string,
): Promise<boolean> {
  try {
    // Look the invite up by its deterministic path (id = invite code)
    const inviteRef = doc(db, "invites", inviteCode);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) return false;

    const inviteData = inviteSnap.data() as Invite;
    if (inviteData.status !== "pending") return false;

    // Upsert the deterministic membership anchor. The invite_code field is
    // included as capability proof - the security rules verify it against the
    // pending invite before allowing this write.
    await setDoc(
      doc(db, "household_members", userId),
      {
        household_id: inviteData.household_id,
        user_id: userId,
        email: email || inviteData.email,
        role: inviteData.role || "dependent",
        custom_role_description: inviteData.custom_role_description || null,
        joined_at: Timestamp.now(),
        invite_code: inviteCode,
      },
      { merge: true },
    );

    // Remove any legacy rows from the user's previous household so the
    // member list stays clean (anchor is the single source of truth)
    await removeLegacyMembershipRows(userId);

    // Mark accepted AFTER the membership write (the rule required it pending)
    await updateDoc(inviteRef, { status: "accepted" });
    clearHouseholdCache();
    clearCache();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "invites");
    return false;
  }
}

export async function updateMemberRole(
  memberId: string,
  role: string,
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "household_members", memberId), { role });
    clearHouseholdCache();
    return true;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `household_members/${memberId}`,
    );
    return false;
  }
}

// Investments
export async function getInvestmentAccounts(
  householdId: string,
): Promise<InvestmentAccount[]> {
  return cachedHhFetch(`invest_accounts_${householdId}`, async () => {
    try {
      const q = query(
        collection(db, "investment_accounts"),
        where("household_id", "==", householdId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as InvestmentAccount,
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "investment_accounts");
      return [];
    }
  });
}

export async function addInvestmentAccount(
  account: Omit<InvestmentAccount, "id" | "created_at">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "investment_accounts"), {
      ...account,
      created_at: Timestamp.now(),
    });
    clearHouseholdCache("invest_accounts");
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "investment_accounts");
    return "";
  }
}

export async function getInvestmentHoldings(
  accountId: string,
): Promise<InvestmentHolding[]> {
  return cachedHhFetch(`invest_holdings_${accountId}`, async () => {
    try {
      const q = query(
        collection(db, "investment_holdings"),
        where("investment_account_id", "==", accountId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as InvestmentHolding,
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "investment_holdings");
      return [];
    }
  });
}

export async function addInvestmentHolding(
  holding: Omit<InvestmentHolding, "id" | "created_at">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "investment_holdings"), {
      ...holding,
      created_at: Timestamp.now(),
    });
    clearHouseholdCache("invest_holdings");
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "investment_holdings");
    return "";
  }
}

export async function getLatestValuation(
  accountId: string,
): Promise<InvestmentValuation | null> {
  return cachedHhFetch(`invest_val_${accountId}`, async () => {
    try {
      const q = query(
        collection(db, "investment_valuations"),
        where("investment_account_id", "==", accountId),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const list = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as InvestmentValuation,
      );
      list.sort((a, b) => b.date.localeCompare(a.date));
      return list[0] || null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "investment_valuations");
      return null;
    }
  });
}

export async function addInvestmentValuation(
  valuation: Omit<InvestmentValuation, "id" | "created_at">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "investment_valuations"), {
      ...valuation,
      created_at: Timestamp.now(),
    });
    clearHouseholdCache("invest_val");
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "investment_valuations");
    return "";
  }
}
