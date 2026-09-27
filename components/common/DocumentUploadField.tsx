/**
 * File: DocumentUploadField.tsx
 * Purpose: Reusable document upload UI component handling file selection, upload state, and preview.
 * Layer: UI / Component
 * Notes: Refactored for production readiness without behavior change.
 */

import React from 'react';
import { UploadCloud, FileText, Edit } from 'lucide-react';

interface DocumentUploadFieldProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove?: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    placeholder?: string;
    isUploading?: boolean;
}

const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({ 
    label, value, onChange, onRemove, inputRef, placeholder = "Upload Document", isUploading = false 
}) => {
    // Determine if file is PDF based on data URL or extension for real URL
    const isPdf = value?.startsWith('data:application/pdf') || value?.toLowerCase().endsWith('.pdf');

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 hover:border-indigo-200 transition-colors">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</label>
            <div className="flex items-center gap-4">
                {isUploading ? (
                    <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : value ? (
                    <div className="relative group w-16 h-16 flex-shrink-0">
                        {isPdf ? (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="w-full h-full bg-red-50 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                                <FileText size={24} />
                            </a>
                        ) : (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                <img src={value} alt="Doc" className="w-full h-full object-cover rounded-lg border border-slate-200" />
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="absolute -top-2 -right-2 bg-white text-slate-500 hover:text-red-500 shadow-md p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                        >
                            <Edit size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="w-16 h-16 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:border-indigo-400 transition-colors">
                        <UploadCloud size={20} />
                    </div>
                )}
                <div className="flex-1">
                    <input
                        type="file"
                        ref={inputRef}
                        onChange={onChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                        disabled={isUploading}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                    >
                        {isUploading ? 'Uploading...' : (value ? 'Change File' : `Upload ${placeholder}`)}
                    </button>
                    {value && !isUploading && onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="w-full py-2 text-rose-500 font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-rose-50 transition-all"
                        >
                            Remove Document
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadField;
