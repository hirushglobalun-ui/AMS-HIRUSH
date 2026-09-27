/**
 * File: FormInput.tsx
 * Purpose: Reusable form input component for standardized styling across modals and forms.
 * Layer: UI / Component
 * Notes: Refactored for production readiness without behavior change.
 */

import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, name, className, required, ...props }) => (
    <div className="flex flex-col gap-2">
        <label htmlFor={name} className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
            {label} {required && <span className="text-red-500 text-sm leading-none ml-1">*</span>}
        </label>
        <input
            id={name}
            name={name}
            required={required}
            className={`w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400 ${className}`}
            {...props}
        />
    </div>
);

export default FormInput;
