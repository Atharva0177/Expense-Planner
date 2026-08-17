import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Household, HouseholdMember } from "../types";
import { getHouseholdMembership, getHousehold, createHousehold } from "../lib/db_household";

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
  refreshHousehold: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdMember, setHouseholdMember] = useState<HouseholdMember | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);

  const refreshHousehold = async (currentUser = user) => {
    if (!currentUser) {
      setHouseholdMember(null);
      setHousehold(null);
      return;
    }
    
    try {
      let member = await getHouseholdMembership(currentUser.uid);
      if (!member) {
        // Auto-create household for the user if they don't have one
        const email = currentUser.email || `user_${currentUser.uid}@example.com`;
        const name = `${email.split('@')[0]}'s Household`;
        await createHousehold(currentUser.uid, name, email);
        member = await getHouseholdMembership(currentUser.uid);
      }
      
      setHouseholdMember(member);
      if (member) {
        const hh = await getHousehold(member.household_id);
        setHousehold(hh);
      }
    } catch (e) {
      console.error("Error refreshing household membership:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await refreshHousehold(user);
      } else {
        setHouseholdMember(null);
        setHousehold(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, householdMember, household, refreshHousehold }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
