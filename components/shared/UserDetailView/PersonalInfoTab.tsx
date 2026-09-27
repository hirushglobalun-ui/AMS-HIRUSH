/**
 * @file PersonalInfoTab.tsx
 * @description React component for rendering PersonalInfoTab UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { User } from '../../../types';
import Card from '../../common/Card';
import { User as UserIcon, Dna, CreditCard, FileText, Download, Trash2 } from 'lucide-react';

interface PersonalInfoTabProps {
    user: User;
    onRemoveDocument: (field: keyof User) => void;
}

const InfoBlock = ({ label, value, highlight, className }: any) => (
    <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <p className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-slate-700'} ${className}`}>{value || '-'}</p>
    </div>
);

const DocItem = ({ label, idNumber, fileUrl, fileName, onRemove }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group/doc hover:bg-white hover:shadow-sm transition-all duration-300">
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            {idNumber ? (
                <p className="text-sm font-black text-slate-700 font-mono tracking-tighter">{idNumber}</p>
            ) : (
                <p className="text-[11px] font-bold text-slate-400 italic">Document copy only</p>
            )}
        </div>
        <div className="flex items-center gap-2">
            {fileUrl && (
                <>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white border border-slate-100 text-primary hover:text-primary-dark rounded-xl shadow-sm hover:shadow-md transition-all active:scale-90">
                        <Download size={18} />
                    </a>
                    <button
                        onClick={onRemove}
                        className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-90 opacity-0 group-hover/doc:opacity-100"
                        title="Remove Document"
                    >
                        <Trash2 size={18} />
                    </button>
                </>
            )}
        </div>
    </div>
);

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ user, onRemoveDocument }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Personal Information */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><UserIcon size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900">Personal Records</h3>
                </div>

                <Card className="!p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <InfoBlock label="Full Legal Name" value={user.name} />
                        <InfoBlock label="Employee ID" value={user.employeeId} />
                        <InfoBlock label="System Role" value={user.role} highlight />
                        <InfoBlock label="Blood Group" value={user.bloodGroup || 'Not Specified'} />
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Dna size={14} /> Identification Documents
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            <DocItem
                                label="Aadhar Identity"
                                idNumber={user.aadharNumber}
                                fileUrl={user.aadharDocument}
                                fileName={`${user.name}_aadhar`}
                                onRemove={() => onRemoveDocument('aadharDocument')}
                            />
                            <DocItem
                                label="Tax Registration (PAN)"
                                idNumber={user.panNumber}
                                fileUrl={user.panDocument}
                                fileName={`${user.name}_pan`}
                                onRemove={() => onRemoveDocument('panDocument')}
                            />
                            {user.otherDocument && (
                                <DocItem
                                    label="Other Credentials"
                                    fileUrl={user.otherDocument}
                                    fileName={`${user.name}_other_document`}
                                    onRemove={() => onRemoveDocument('otherDocument')}
                                />
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Financial/Bank Records */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900">Bank & Payroll</h3>
                </div>

                <Card className="!p-8 space-y-8 h-full">
                    {user.bankName ? (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <InfoBlock label="Preferred Bank" value={user.bankName} />
                                <InfoBlock label="Account Holder" value={user.accountHolderName || user.name} />
                                <InfoBlock label="Account Number" value={user.accountNumber} className="font-mono text-xs" />
                                <InfoBlock label="IFSC Code" value={user.ifscCode} className="font-mono" />
                                <InfoBlock label="Account Type" value={user.accountType || 'Savings'} />
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Verification Documents</h4>
                                {user.bankDocument ? (
                                    <a
                                        href={user.bankDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-slate-200 transition-all group"
                                    >
                                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-50">
                                            <FileText size={20} className="text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700">Bank Passbook / Cheque</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Document • PDF/IMG</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Download size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onRemoveDocument('bankDocument');
                                                }}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Remove Document"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </a>
                                ) : (
                                    <p className="text-xs text-slate-400 font-medium italic">No document uploaded yet</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center"><CreditCard size={32} /></div>
                            <p className="text-slate-400 font-medium">No financial records have been <br />linked to this profile yet.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PersonalInfoTab;
