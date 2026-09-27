/**
 * File: UserFormModal.tsx
 * Purpose: Handles the creation and editing of user profiles, including document uploads.
 * Layer: UI / Component / Modal
 * Notes: Refactored for production readiness without behavior change. Extracted from ManageUsers.tsx to enforce 300-line limit.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, Briefcase, Building2, FileText, CheckCircle, EyeOff, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db, secondaryAuth } from '../../../firebase';
import { collection, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { User, Role, UserStatus } from '../../../types';
import { uploadToBlob } from '../../../services/blobService';
import { logAuditEvent, AuditActionType } from '../../../services/auditService';
import FormInput from '../../common/FormInput';
import DocumentUploadField from '../../common/DocumentUploadField';
import { generateEmployeeId, emptyUser } from '../../../utils/userUtils';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    allUsers: User[];
    onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, editingUser, allUsers, onSuccess }) => {
    const [formData, setFormData] = useState<Omit<User, 'id'>>({ ...emptyUser });
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const aadharDocRef = useRef<HTMLInputElement>(null);
    const panDocRef = useRef<HTMLInputElement>(null);
    const bankDocRef = useRef<HTMLInputElement>(null);
    const otherDocRef = useRef<HTMLInputElement>(null);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            setShowPassword(false);
            if (editingUser) {
                setFormData({ ...emptyUser, ...editingUser });
            } else {
                const initialRole = Role.EMPLOYEE;
                setFormData({
                    ...emptyUser,
                    employeeId: generateEmployeeId(initialRole, allUsers),
                    role: initialRole,
                    status: UserStatus.ACTIVE
                });
            }
        }
    }, [isOpen, editingUser, allUsers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Regenerate employee ID if role changes for a new user
            if (name === 'role') {
                if (!editingUser || (editingUser && value !== editingUser.role)) {
                    newState.employeeId = generateEmployeeId(value as Role, allUsers);
                }
            }
            return newState;
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'aadharDocument' | 'panDocument' | 'bankDocument' | 'otherDocument') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadingDocs(prev => ({ ...prev, [fieldName]: true }));

            try {
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filename = `user-docs/${Date.now()}-${cleanName}`;
                const url = await uploadToBlob(file, filename);

                setFormData(prev => ({ ...prev, [fieldName]: url }));
                toast.success("Document uploaded successfully!");
            } catch (error) {
                console.error(`Error uploading ${fieldName}:`, error);
                toast.error("Failed to upload document. Please try again.");
            } finally {
                setUploadingDocs(prev => ({ ...prev, [fieldName]: false }));
                e.target.value = '';
            }
        }
    };

    const handleRemoveFormField = (fieldName: 'aadharDocument' | 'panDocument' | 'bankDocument' | 'otherDocument') => {
        setFormData(prev => ({ ...prev, [fieldName]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingUser) {
                const userRef = doc(db, 'users', editingUser.id);
                const { password, ...updateData } = formData;
                const dataToUpdate: any = updateData;

                await updateDoc(userRef, dataToUpdate);
                
                logAuditEvent({
                    actionType: AuditActionType.PROFILE_UPDATE,
                    userId: editingUser.id,
                    userName: formData.name,
                    details: `Profile updated by admin/HR. Role: ${formData.role}`
                });

                toast.success("User updated successfully!");
            } else {
                // Create user in Firebase Auth
                const userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password || 'password123');
                
                // Save profile to Firestore using Auth UID
                const { password, ...profileData } = formData;
                await setDoc(doc(db, 'users', userCred.user.uid), profileData);
                
                logAuditEvent({
                    actionType: AuditActionType.USER_CREATED,
                    userId: userCred.user.uid,
                    userName: formData.name,
                    details: `New user created by admin/HR. Role: ${formData.role}`
                });

                toast.success("User added successfully!");
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving user:", error);
            toast.error("Failed to save user.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            onClick={onClose}
            className="fixed inset-0 bg-transparent flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900">{editingUser ? 'Edit Profile' : 'New Employee'}</h3>
                        <p className="text-xs sm:text-sm text-slate-500">{editingUser ? 'Update account details' : 'Create a new staff account'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <form id="user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pt-4 sm:pt-6">
                    <div className="space-y-8">
                        {/* Photo & Basic Info Section */}
                        <div className="flex flex-col sm:flex-row gap-8 items-start">
                            <div className="flex flex-col items-center gap-4 flex-shrink-0">
                                <div className="relative group">
                                    <img
                                        src={formData.profilePhoto || 'https://via.placeholder.com/150'}
                                        alt="Profile Preview"
                                        className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-md group-hover:opacity-90 transition-opacity"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <div className="bg-black/40 backdrop-blur-sm p-2 rounded-full text-white">
                                            <UploadCloud size={20} />
                                        </div>
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 tracking-wide uppercase"
                                >
                                    Change Photo
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow w-full">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" />
                                    <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="john@example.com" />
                                </div>
                                <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob || ''} onChange={handleInputChange} />
                                <FormInput label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate || ''} onChange={handleInputChange} />
                            </div>
                        </div>

                        {/* Professional Info Section */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase size={16} className="text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Professional Details</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormInput label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required readOnly className="!bg-slate-100 !text-slate-500 cursor-not-allowed font-mono" />
                                <FormInput label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="+91 XXXX XXX XXX" />
                                <FormInput label="Emergency Contact (Optional)" name="emergencyPhone" type="tel" value={formData.emergencyPhone || ''} onChange={handleInputChange} placeholder="+91 XXXX XXX XXX" />
                                <FormInput label="Position" name="position" value={formData.position || ''} onChange={handleInputChange} placeholder="e.g., Senior Developer" />
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="SEO">SEO</option>
                                        <option value="Development">Development</option>
                                        <option value="Product">Product</option>
                                        <option value="Media">Media</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Visitor">Visitor</option>
                                    </select>
                                </div>
                                {(formData.department === 'Visitor' || formData.role === Role.VISITOR) && (
                                    <FormInput
                                        label="Company Name (Optional)"
                                        name="companyName"
                                        value={formData.companyName || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter Company Name"
                                    />
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Group</label>
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700"
                                        required
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details Section */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 size={16} className="text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Bank Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormInput label="Bank Name" name="bankName" value={formData.bankName || ''} onChange={handleInputChange} placeholder="e.g. HDFC Bank" />
                                <FormInput label="Account Number" name="accountNumber" value={formData.accountNumber || ''} onChange={handleInputChange} placeholder="XXXXXXXXXXXX" />
                                <FormInput label="IFSC Code" name="ifscCode" value={formData.ifscCode || ''} onChange={handleInputChange} placeholder="HDFC0001234" />
                                <FormInput label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName || ''} onChange={handleInputChange} placeholder="As per bank records" />
                            </div>
                        </div>

                        {/* Documents & IDs Section */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={16} className="text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Documents & IDs</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormInput label="Aadhar Number" name="aadharNumber" value={formData.aadharNumber || ''} onChange={handleInputChange} placeholder="12-digit UID" />
                                <FormInput label="PAN Number" name="panNumber" value={formData.panNumber || ''} onChange={handleInputChange} placeholder="10-digit PAN" />
                            </div>

                            {/* File Uploads Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                                <DocumentUploadField
                                    label="Aadhar Card"
                                    value={formData.aadharDocument}
                                    onChange={(e: any) => handleDocumentChange(e, 'aadharDocument')}
                                    onRemove={() => handleRemoveFormField('aadharDocument')}
                                    inputRef={aadharDocRef}
                                    isUploading={uploadingDocs.aadharDocument}
                                />
                                <DocumentUploadField
                                    label="PAN Card"
                                    value={formData.panDocument}
                                    onChange={(e: any) => handleDocumentChange(e, 'panDocument')}
                                    onRemove={() => handleRemoveFormField('panDocument')}
                                    inputRef={panDocRef}
                                    isUploading={uploadingDocs.panDocument}
                                />
                                <DocumentUploadField
                                    label="Bank Proof"
                                    value={formData.bankDocument}
                                    onChange={(e: any) => handleDocumentChange(e, 'bankDocument')}
                                    onRemove={() => handleRemoveFormField('bankDocument')}
                                    inputRef={bankDocRef}
                                    placeholder="Cheque / Passbook"
                                    isUploading={uploadingDocs.bankDocument}
                                />
                                <DocumentUploadField
                                    label="Address Proof"
                                    value={formData.otherDocument}
                                    onChange={(e: any) => handleDocumentChange(e, 'otherDocument')}
                                    onRemove={() => handleRemoveFormField('otherDocument')}
                                    inputRef={otherDocRef}
                                    placeholder="Utility Bill / Rent Agmt"
                                    isUploading={uploadingDocs.otherDocument}
                                />
                            </div>
                        </div>

                        {/* Account Access Section */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={16} className="text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">System Access</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700"
                                        disabled={!!editingUser && editingUser.role === Role.ADMIN}
                                    >
                                        {Object.values(Role).map(role =>
                                            <option
                                                key={role}
                                                value={role}
                                                disabled={role === Role.ADMIN && editingUser?.role !== Role.ADMIN && !editingUser}
                                            >
                                                {role}
                                            </option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                                    {!editingUser ? (
                                        <div className="relative">
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password || ''}
                                                onChange={handleInputChange}
                                                placeholder="Minimum 6 characters"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none pr-12 font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            Passwords are now securely managed by Firebase Auth. To reset, use the 'Forgot Password' flow.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Modal Footer */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all text-sm"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="user-form"
                        disabled={isSaving}
                        className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 text-sm"
                    >
                        {isSaving ? 'Saving...' : (editingUser ? 'Update Profile' : 'Create User')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserFormModal;
