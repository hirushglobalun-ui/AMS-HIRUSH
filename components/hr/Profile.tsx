/**
 * @file Profile.tsx
 * @description React component for rendering Profile UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */


import React, { useState, useRef } from 'react';
import { User } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user: admin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(admin || {} as User);
  const [isSaving, setIsSaving] = useState(false);
  const [passwords, setPasswords] = useState({
      newPassword: '',
      confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
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

  const handleSave = async () => {
    if (!admin) return;
    setIsSaving(true);
    const userRef = doc(db, 'users', admin.id);
    const dataToUpdate: Partial<User> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profilePhoto: formData.profilePhoto
    };

    // Password change logic
    const { newPassword, confirmPassword } = passwords;
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            setIsSaving(false);
            return;
        }
        dataToUpdate.password = newPassword;
    }

    try {
        await updateDoc(userRef, dataToUpdate);
        
        // Global state is handled by AuthProvider snapshot
        setIsEditing(false);
        setPasswords({ newPassword: '', confirmPassword: '' });
        setIsSaving(false);
        toast.success("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile.");
        setIsSaving(false);
    }
  };

  const formInputClasses = "mt-1 block w-full text-lg border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-slate-50 p-2";

  if (!admin) return null;

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Profile</h2>
        <Button onClick={() => setIsEditing(!isEditing)} variant="secondary">
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <img src={formData.profilePhoto} alt="Profile" className="w-32 h-32 rounded-full border-4 border-primary shadow-lg object-cover" />
           {isEditing && (
            <>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full mt-2 text-sm" variant='secondary'>Change Photo</Button>
            </>
           )}
        </div>
        <div className="flex-grow w-full">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField label="Full Name" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                    <ProfileField label="Employee ID" value={formData.employeeId} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField label="Department" value={formData.department} />
                    <ProfileField label="Email" name="email" value={formData.email} isEditing={isEditing} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <ProfileField label="Phone Number" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField label="Position" value={formData.position || ''} />
                    <ProfileField label="Blood Group" value={formData.bloodGroup || ''} />
                </div>

                {isEditing && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 space-y-4">
                        <h3 className="text-lg font-semibold">Change Password</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">New Password</label>
                                <div className="relative mt-1">
                                    <input type={showNewPassword ? 'text' : 'password'} name="newPassword" placeholder="Enter new password" value={passwords.newPassword} onChange={handlePasswordChange} className={`${formInputClasses} pr-10`} />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500">
                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Confirm New Password</label>
                                <div className="relative mt-1">
                                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={handlePasswordChange} className={`${formInputClasses} pr-10`} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500">
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                           </div>
                        </div>
                    </div>
                )}
                
                {isEditing && (
                    <div className="text-right mt-6">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </Card>
  );
};

interface ProfileFieldProps {
    label: string;
    name?: string;
    value: string;
    isEditing?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({label, name, value, isEditing = false, onChange, type = "text", placeholder}) => (
    <div>
        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">{label}</label>
        {isEditing && name ? (
            <input 
                type={type}
                name={name} 
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
                className="mt-1 block w-full text-lg border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-slate-50 p-2" 
            />
        ) : (
            <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{type === 'password' ? '********' : value}</p>
        )}
    </div>
);

export default Profile;