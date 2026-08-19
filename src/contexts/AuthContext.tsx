import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Household, HouseholdMember } from "../types";
import {
  getHouseholdMembership,
  getHousehold,
  createHousehold,
} from "../lib/db_household";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  householdMember: HouseholdMember | null;
  household: Household | null;
  refreshHousehold: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  householdMember: null,
  household: null,
  refreshHousehold: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdMember, setHouseholdMember] =
    useState<HouseholdMember | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);

  const refreshHousehold = async (currentUser = user) => {
    if (!currentUser) {
      setHouseholdMember(null);
      setHousehold(null);
      return;
    }

    try {
      // 5-second timeout wrapper to prevent any hanging Firestore requests
      const fetchWithTimeout = async () => {
        let member = await getHouseholdMembership(currentUser.uid);
        if (!member) {
          // Auto-create household for the user if they don't have one
          const email =
            currentUser.email || `user_${currentUser.uid}@example.com`;
          const name = `${email.split("@")[0]}'s Household`;
          await createHousehold(currentUser.uid, name, email);
          member = await getHouseholdMembership(currentUser.uid);
        }

        setHouseholdMember(member);
        if (member) {
          const hh = await getHousehold(member.household_id);
          setHousehold(hh);
        }
      };

      await Promise.race([
        fetchWithTimeout(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Household fetch timeout")), 5000),
        ),
      ]);
    } catch (e) {
      console.warn("Household membership refresh notice:", e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ensure loading screen NEVER hangs beyond 2.5s even if network is slow
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      setUser(firebaseUser);
      setLoading(false);
      clearTimeout(safetyTimer);

      if (firebaseUser) {
        // Refresh household asynchronously without blocking the UI
        refreshHousehold(firebaseUser);
      } else {
        setHouseholdMember(null);
        setHousehold(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, householdMember, household, refreshHousehold }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
