"use client";

/**
 * @file FirstTimeSetup.tsx
 * @description React component for rendering FirstTimeSetup UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Role, UserStatus } from '../../types';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

interface FirstTimeSetupProps {
    onSetupComplete: () => void;
}

const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({ onSetupComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: 'Management',
    });
    const [isLoading, setIsLoading] = useState(false);
    const formInputClasses = "mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            toast.error("Please fill in all required fields.");
            return;
        }
        setIsLoading(true);
        try {
            // 1. Create secure Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const userUid = userCredential.user.uid;

            // 2. Create the user profile document in Firestore using the auth UID
            await setDoc(doc(db, 'users', userUid), {
                name: formData.name,
                email: formData.email,
                department: formData.department,
                employeeId: 'HRA001',
                role: Role.ADMIN,
                status: UserStatus.ACTIVE,
                profilePhoto: `https://i.pravatar.cc/150?u=${formData.email}`,
                phone: ''
            });

            toast.success("Admin account created successfully! The application will now reload.", {
                duration: 3000
            });
            setTimeout(() => {
                onSetupComplete();
            }, 2000);
        } catch (error: any) {
            console.error("Error creating admin user: ", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("An account with this email already exists.");
            } else if (error.code === 'auth/weak-password') {
                toast.error("Password should be at least 6 characters.");
            } else {
                toast.error(`Could not create admin user: ${error.message}`);
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <div>
                    <h2 className="text-2xl font-bold text-center text-primary">First-Time Setup</h2>
                    <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                        Welcome! It looks like this is a new installation. Please create the first administrator account to get started.
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</label>
                        <input type="text" name="name" id="name" required value={formData.name} onChange={handleInputChange} className={formInputClasses} placeholder="e.g., Jane Doe" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</label>
                        <input type="email" name="email" id="email" required value={formData.email} onChange={handleInputChange} className={formInputClasses} placeholder="e.g., admin@hirush.com" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-500 dark:text-slate-400">Password</label>
                        <input type="password" name="password" id="password" required value={formData.password} onChange={handleInputChange} className={formInputClasses} placeholder="Create a secure password" />
                    </div>
                     <div>
                        <label htmlFor="department" className="block text-sm font-medium text-slate-500 dark:text-slate-400">Department</label>
                        <input type="text" name="department" id="department" required value={formData.department} onChange={handleInputChange} className={formInputClasses} />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full justify-center py-2.5" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Admin Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FirstTimeSetup;