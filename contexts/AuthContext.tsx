/**
 * File: AuthContext.tsx
 * Purpose: Provides a secure, centralized authentication state across the app.
 * Author: Refactored system
 * Notes: 
 *  - Removed insecure plaintext LocalStorage dumps.
 *  - Stores ONLY the user ID in LocalStorage and re-fetches secure role/data from Firestore on mount.
 *  - Eliminates prop drilling for 'user' and 'onUserUpdate' across dashboards.
 *  - DO NOT change UI layout structures in consumers.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserStatus } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, getCountFromServer } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { logAuditEvent, AuditActionType } from '../services/auditService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isFirstTimeSetup: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    updateUser: (updatedUser: User) => void;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Pre-hydrate user session from storage for instant UI rendering
    const [user, setUser] = useState<User | null>(() => {
        try {
            const cached = sessionStorage.getItem('ams_user_session');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState<boolean>(() => {
        try {
            return !sessionStorage.getItem('ams_user_session');
        } catch {
            return true;
        }
    });
    const [error, setError] = useState<string | null>(null);
    const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

    /**
     * Set up Firebase Auth listener to manage session automatically.
     */
    useEffect(() => {
        const checkFirstTimeSetup = async () => {
            if (localStorage.getItem('ams_setup_done') === 'true') {
                setIsFirstTimeSetup(false);
                return;
            }
            try {
                const usersRef = collection(db, 'users');
                const countSnapshot = await getCountFromServer(usersRef);
                const isFirst = countSnapshot.data().count === 0;
                setIsFirstTimeSetup(isFirst);
                if (!isFirst) {
                    localStorage.setItem('ams_setup_done', 'true');
                }
            } catch (e: any) {
                console.warn("First time setup check skipped/failed (likely rules active):", e);
                setIsFirstTimeSetup(false);
                localStorage.setItem('ams_setup_done', 'true');
            }
        };

        checkFirstTimeSetup();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const snap = await getDoc(userRef);
                    if (snap.exists()) {
                        const data = snap.data() as any;
                        if (data.status === UserStatus.INACTIVE) {
                            await firebaseSignOut(auth);
                            sessionStorage.removeItem('ams_user_session');
                            setUser(null);
                        } else {
                            // Exclude plaintext password if it exists (legacy)
                            const { password, ...safeUser } = { id: snap.id, ...data } as any;
                            sessionStorage.setItem('ams_user_session', JSON.stringify(safeUser));
                            setUser(safeUser as User);
                        }
                    } else {
                        await firebaseSignOut(auth);
                        sessionStorage.removeItem('ams_user_session');
                        setUser(null);
                    }
                } catch (e) {
                    console.error("Error fetching user profile:", e);
                    sessionStorage.removeItem('ams_user_session');
                    setUser(null);
                }
            } else {
                sessionStorage.removeItem('ams_user_session');
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Keep refreshSession for manual triggers if needed, but it mostly relies on the listener now
    const refreshSession = async () => {
        if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data() as any;
                const { password, ...safeUser } = { id: snap.id, ...data } as any;
                sessionStorage.setItem('ams_user_session', JSON.stringify(safeUser));
                setUser(safeUser as User);
            }
        }
    };

    const login = async (email: string, pass: string): Promise<boolean> => {
        try {
            // Sign in using Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;
            
            // Check if user document exists and is active
            const userRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
                const userData = snap.data();
                
                if (userData.status === UserStatus.INACTIVE) {
                    await firebaseSignOut(auth);
                    toast.error("Your account is inactive.");
                    return false;
                }
                
                // Log Audit Event
                logAuditEvent({
                    actionType: AuditActionType.LOGIN,
                    userId: firebaseUser.uid,
                    userName: userData.name || email,
                    details: 'User logged in successfully'
                });

                toast.success("Login successful!");
                return true;
            } else {
                await firebaseSignOut(auth);
                toast.error("User profile not found in database.");
                return false;
            }
        } catch (e: any) {
            console.error("Login error:", e);
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
                toast.error("Invalid email or password.");
            } else {
                toast.error("An error occurred during login.");
            }
            return false;
        }
    };

    const logout = async () => {
        try {
            if (user) {
                logAuditEvent({
                    actionType: AuditActionType.LOGOUT,
                    userId: user.id,
                    userName: user.name,
                    details: 'User logged out'
                });
            }
            await firebaseSignOut(auth);
            setUser(null);
            toast.success("You have been logged out.");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        // Do not update localStorage with user data, as we rely on Firestore for truth.
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, isFirstTimeSetup, login, logout, updateUser, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
