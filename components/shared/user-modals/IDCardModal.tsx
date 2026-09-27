/**
 * File: IDCardModal.tsx
 * Purpose: Renders a printable and downloadable Digital Access Pass (ID Card) for a user.
 * Layer: UI / Component / Modal
 * Notes: Refactored for production readiness without behavior change.
 */

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { User } from '../../../types';
import IDCard from '../../admin/IDCard'; // Keep importing original IDCard for now
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

interface IDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    idCardUser: User | null;
}

const IDCardModal: React.FC<IDCardModalProps> = ({ isOpen, onClose, idCardUser }) => {
    const idCardRef = useRef<HTMLDivElement>(null);

    const handleDownloadIDCard = async () => {
        const element = idCardRef.current;
        if (!element || !idCardUser) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher quality
                backgroundColor: null,
                useCORS: true // For images
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${idCardUser.name.replace(/\s+/g, '_')}_ID_Card.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("ID Card downloaded successfully!");
        } catch (error) {
            console.error("Error downloading ID card:", error);
            toast.error("Failed to download ID card.");
        }
    };

    if (!isOpen || !idCardUser) return null;

    return createPortal(
        <div 
            onClick={onClose}
            className="fixed inset-0 bg-transparent flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8 max-w-md w-full m-4 relative overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* ID Card Component */}
                <div ref={idCardRef} className="bg-white flex justify-center pb-6">
                    <IDCard user={idCardUser} />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-4 border-t border-slate-100 pt-6">
                    <button
                        onClick={handleDownloadIDCard}
                        className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Download size={20} />
                        Download ID Card Image
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>

                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #id-card-print-area, #id-card-print-area * { visibility: visible; }
                        #id-card-print-area {
                            position: fixed; left: 50%; top: 50%;
                            transform: translate(-50%, -50%) scale(1.5);
                        }
                    }
                `}</style>
            </div>
        </div>,
        document.body
    );
};

export default IDCardModal;
