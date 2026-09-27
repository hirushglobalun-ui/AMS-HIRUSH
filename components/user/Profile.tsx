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
import { Eye, EyeOff, Download, CreditCard, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import IDCard from '../admin/IDCard';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user || {} as User);
  const [isSaving, setIsSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
    if (!user) return;
    setIsSaving(true);
    const userRef = doc(db, 'users', user.id);
    const dataToUpdate: Partial<User> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      emergencyPhone: formData.emergencyPhone,
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        {/* Simple Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b border-slate-100">
          <div className="relative group shrink-0">
            <img
              src={formData.profilePhoto}
              alt={formData.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
            />
            {isEditing && (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              </>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-800">{formData.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">{formData.role}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{formData.department}</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">{formData.position || 'Employee'}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto mt-4 md:mt-0">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'outline' : 'primary'}
              size="sm"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
            {!isEditing && (
              <Button
                onClick={() => setShowIDCard(true)}
                variant="primary"
                size="sm"
              >
                <CreditCard size={16} className="mr-2" />
                Digital ID
              </Button>
            )}
          </div>
        </div>

        {/* Content Divider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Left Box: Personal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-50 pb-2">Personal Details</h3>
            <div className="space-y-4">
              <ProfileField label="Full Name" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
              <ProfileField label="Email Address" name="email" value={formData.email} isEditing={isEditing} onChange={handleInputChange} type="email" />
              <ProfileField label="Phone Number" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleInputChange} type="tel" />
              <ProfileField label="Emergency Contact" name="emergencyPhone" value={formData.emergencyPhone || ''} isEditing={isEditing} onChange={handleInputChange} type="tel" placeholder="Optional" />
              <ProfileField label="Blood Group" value={formData.bloodGroup || 'Not set'} />
            </div>
          </div>

          {/* Right Box: Work */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-50 pb-2">Work Information</h3>
            <div className="space-y-4">
              <ProfileField label="Employee ID" value={formData.employeeId} />
              <ProfileField label="Department" value={formData.department} />
              <ProfileField label="Designation" value={formData.position || 'N/A'} />
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Account Role</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-md text-slate-600 text-sm">
                  {formData.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode: Security Section */}
        {isEditing && (
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-2 rounded-b-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">Security Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} name="newPassword" placeholder="New password" value={passwords.newPassword} onChange={handlePasswordChange} className={`${formInputClasses} !bg-white`} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm password" value={passwords.confirmPassword} onChange={handlePasswordChange} className={`${formInputClasses} !bg-white`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-6 pb-4">
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px] justify-center">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ID Card Modal */}
      {showIDCard && createPortal(
        <div 
          onClick={() => setShowIDCard(false)}
          className="fixed inset-0 bg-transparent flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-10 w-full max-w-sm m-4 flex flex-col items-center relative animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setShowIDCard(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Your Identity Card</h3>
              <p className="text-sm text-slate-500">Official Hirush Global ID</p>
            </div>

            <div id="user-id-card-download" className="mb-8 shadow-2xl rounded-xl overflow-hidden">
              <IDCard user={user} />
            </div>

            <Button
              onClick={async () => {
                const element = document.getElementById('user-id-card-download');
                if (!element) return;
                setIsDownloading(true);
                try {
                  const canvas = await html2canvas(element, {
                    scale: 3,
                    backgroundColor: null,
                    useCORS: true
                  });
                  const image = canvas.toDataURL("image/png");
                  const link = document.createElement('a');
                  link.href = image;
                  link.download = `${user.name.replace(/\s+/g, '_')}_ID_Card.png`;
                  link.click();
                  toast.success("Downloaded successfully!");
                } catch (err) {
                  toast.error("Failed to download ID card");
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={20} />
              {isDownloading ? 'Downloading...' : 'Download ID Card'}
            </Button>
          </div>
        </div>,
        document.body
      )}

      {!isEditing && (
        <p className="text-center text-slate-400 text-xs mt-4">
          Need to update restricted information? Contact the administrator.
        </p>
      )}
    </div>
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

const ProfileField: React.FC<ProfileFieldProps> = ({ label, name, value, isEditing = false, onChange, type = "text", placeholder }) => (
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