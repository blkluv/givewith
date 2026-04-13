"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface FirestoreUser {
  email: string;
  displayName: string;
  role: "donor" | "charity" | "admin";
  locusWalletAddress?: string;
  locusClaimUrl?: string;
  walletStatus?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  /**
   * True once the Firestore listener has fired at least one snapshot for the
   * current user. Use `user && firestoreUserLoaded && !firestoreUser` to
   * detect an orphaned auth account whose wallet provisioning failed.
   */
  firestoreUserLoaded: boolean;
  loading: boolean;
  walletBalance: string | null;
  balanceLoading: boolean;
  signOut: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(
    null,
  );
  const [firestoreUserLoaded, setFirestoreUserLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setFirestoreUser(null);
        setFirestoreUserLoaded(false);
        setWalletBalance(null);
        setLoading(false);
        return;
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen for Firestore user document changes
  useEffect(() => {
    if (!user) return;

    setFirestoreUserLoaded(false);
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        setFirestoreUser(
          snapshot.exists() ? (snapshot.data() as FirestoreUser) : null,
        );
        setFirestoreUserLoaded(true);
      },
      (error) => {
        console.error("Error listening to user doc:", error);
        setFirestoreUserLoaded(true);
      },
    );

    return unsubscribe;
  }, [user]);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirestoreUser(null);
    setWalletBalance(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firestoreUser,
        firestoreUserLoaded,
        loading,
        walletBalance,
        balanceLoading,
        signOut,
        refreshBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
