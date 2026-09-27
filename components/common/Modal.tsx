"use client";

/**
 * @file Modal.tsx
 * @description React component for rendering Modal UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const [mounted, setMounted] = useState(true);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-transparent animate-in fade-in duration-200"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-indigo-50 sticky top-0 bg-white z-10">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 sm:p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
