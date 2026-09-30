"use client";

/**
 * File: UserFormModal.tsx
 * Purpose: Handles the creation and editing of user profiles, including document uploads.
 * Layer: UI / Component / Modal
 * Notes: Mobile-safe custom dropdowns added for Role, Department,
 * Blood Group and Account Status.
 */

import React, {
    useState,
    useRef,
    useEffect,
    useCallback
} from "react";
import { createPortal } from "react-dom";
import {
    X,
    UploadCloud,
    Briefcase,
    Building2,
    FileText,
    CheckCircle,
    EyeOff,
    Eye,
    ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { db, secondaryAuth } from "../../../firebase";
import {
    doc,
    updateDoc,
    setDoc,
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
} from "firebase/auth";
import {
    User,
    Role,
    UserStatus,
} from "../../../types";
import {
    uploadToCloudinary,
} from "../../../services/cloudinaryService";
import {
    logAuditEvent,
    AuditActionType,
} from "../../../services/auditService";
import FormInput from "../../common/FormInput";
import DocumentUploadField from "../../common/DocumentUploadField";
import {
    generateEmployeeId,
    emptyUser,
} from "../../../utils/userUtils";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    allUsers: User[];
    onSuccess: () => void;
}

interface CustomSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface CustomSelectProps {
    label: string;
    value: string;
    options: CustomSelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    value,
    options,
    onChange,
    disabled = false,
    required = false,
    placeholder = "Select",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(
        (option) => option.value === value
    );
    const updateMenuPosition = useCallback(() => {
        if (!buttonRef.current) return;

        const rect =
            buttonRef.current.getBoundingClientRect();

        const menuHeight = Math.min(
            options.length * 44 + 8,
            260
        );

        const spaceBelow =
            window.innerHeight - rect.bottom;

        const spaceAbove = rect.top;

        let top = rect.bottom + 6;

        if (
            spaceBelow < menuHeight &&
            spaceAbove > spaceBelow
        ) {
            top = rect.top - menuHeight - 6;
        }

        setMenuPosition({
            top,
            left: rect.left,
            width: rect.width,
        });
    }, [options.length]);
    useEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                wrapperRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            setIsOpen(false);
        };

        const handleResize = () => {
            updateMenuPosition();
        };

        const handleScroll = () => {
            updateMenuPosition();
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        window.addEventListener(
            "resize",
            handleResize
        );

        window.addEventListener(
            "scroll",
            handleScroll,
            true
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            window.removeEventListener(
                "resize",
                handleResize
            );

            window.removeEventListener(
                "scroll",
                handleScroll,
                true
            );
        };
    }, [isOpen, options.length, updateMenuPosition]);

    return (
        <div
            ref={wrapperRef}
            className="w-full min-w-0"
        >
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {label}

                {required && (
                    <span className="text-red-500 ml-1">
                        *
                    </span>
                )}
            </label>

            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;

                    if (!isOpen) {
                        updateMenuPosition();
                    }

                    setIsOpen((prev) => !prev);
                }}
                className={`
                    w-full min-w-0 h-[52px]
                    px-4 py-3
                    rounded-xl
                    border border-slate-300
                    bg-white
                    text-slate-800
                    font-medium
                    outline-none
                    shadow-sm
                    transition-all duration-200
                    flex items-center justify-between
                    gap-3
                    text-left
                    hover:border-slate-400
                    focus:border-indigo-600
                    focus:ring-4
                    focus:ring-indigo-500/15
                    disabled:bg-slate-100
                    disabled:text-slate-500
                    disabled:border-slate-200
                    disabled:cursor-not-allowed
                    ${isOpen
                        ? "border-indigo-600 ring-4 ring-indigo-500/15"
                        : ""
                    }
                `}
            >
                <span
                    className={`
                        truncate
                        min-w-0
                        ${selectedOption
                            ? "text-slate-800"
                            : "text-slate-400"
                        }
                    `}
                >
                    {selectedOption?.label ||
                        placeholder}
                </span>

                <ChevronDown
                    size={18}
                    className={`
                        flex-shrink-0
                        text-slate-500
                        transition-transform duration-200
                        ${isOpen
                            ? "rotate-180 text-indigo-600"
                            : ""
                        }
                    `}
                />
            </button>

            {isOpen &&
                createPortal(
                    <>
                        {/* Mobile backdrop */}
                        <button
                            type="button"
                            aria-label="Close dropdown"
                            onClick={() =>
                                setIsOpen(false)
                            }
                            className="fixed inset-0 z-[10000] bg-transparent md:hidden"
                        />

                        {/* Dropdown */}
                        <div
                            ref={menuRef}
                            className="
                                fixed
                                z-[10001]
                                overflow-hidden
                                rounded-xl
                                border border-slate-200
                                bg-white
                                shadow-2xl
                            "
                            style={{
                                top: menuPosition.top,
                                left: menuPosition.left,
                                width: menuPosition.width,
                            }}
                        >
                            <div className="max-h-[260px] overflow-y-auto overscroll-contain py-1">
                                {options.map((option) => {
                                    const isSelected =
                                        option.value ===
                                        value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={
                                                option.disabled
                                            }
                                            onClick={() => {
                                                if (
                                                    option.disabled
                                                ) {
                                                    return;
                                                }

                                                onChange(
                                                    option.value
                                                );

                                                setIsOpen(
                                                    false
                                                );
                                            }}
                                            className={`
                                                w-full
                                                px-4 py-3
                                                text-left
                                                text-sm
                                                font-medium
                                                transition-colors
                                                flex
                                                items-center
                                                justify-between
                                                gap-3
                                                ${option.disabled
                                                    ? "text-slate-300 cursor-not-allowed bg-slate-50"
                                                    : isSelected
                                                        ? "bg-indigo-50 text-indigo-700"
                                                        : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                                                }
                                            `}
                                        >
                                            <span className="truncate">
                                                {
                                                    option.label
                                                }
                                            </span>

                                            {isSelected && (
                                                <CheckCircle
                                                    size={16}
                                                    className="flex-shrink-0 text-indigo-600"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
};

const UserFormModal: React.FC<
    UserFormModalProps
> = ({
    isOpen,
    onClose,
    editingUser,
    allUsers,
    onSuccess,
}) => {
        const [formData, setFormData] = useState<
            Omit<User, "id">
        >({
            ...emptyUser,
        });

        const [showPassword, setShowPassword] =
            useState(false);

        const [isSaving, setIsSaving] =
            useState(false);

        const [uploadingDocs, setUploadingDocs] =
            useState<Record<string, boolean>>({});

        const fileInputRef =
            useRef<HTMLInputElement>(null);

        const aadharDocRef =
            useRef<HTMLInputElement>(null);

        const panDocRef =
            useRef<HTMLInputElement>(null);

        const bankDocRef =
            useRef<HTMLInputElement>(null);

        const otherDocRef =
            useRef<HTMLInputElement>(null);

        // Initialize form data when modal opens
        useEffect(() => {
            if (isOpen) {
                setShowPassword(false);

                if (editingUser) {
                    setFormData({
                        ...emptyUser,
                        ...editingUser,
                        email:
                            editingUser.email
                                ?.toLowerCase() || "",
                        phone: String(
                            editingUser.phone || ""
                        )
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        emergencyPhone: String(
                            editingUser.emergencyPhone || ""
                        )
                            .replace(/\D/g, "")
                            .slice(0, 10),
                    });
                } else {
                    const initialRole =
                        Role.EMPLOYEE;

                    setFormData({
                        ...emptyUser,
                        employeeId:
                            generateEmployeeId(
                                initialRole,
                                allUsers
                            ),
                        role: initialRole,
                        status:
                            UserStatus.ACTIVE,
                    });
                }
            }
        }, [
            isOpen,
            editingUser,
            allUsers,
        ]);

        const handleInputChange = (
            e: React.ChangeEvent<
                HTMLInputElement |
                HTMLSelectElement
            >
        ) => {
            const {
                name,
                value,
            } = e.target;

            let updatedValue = value;

            // Name: letters and spaces only
            if (name === "name") {
                updatedValue =
                    value.replace(
                        /[^a-zA-Z\s]/g,
                        ""
                    );
            }

            // Email: lowercase only
            if (name === "email") {
                updatedValue =
                    value.toLowerCase();
            }
            //Account Number: only digits
            if (name === "accountNumber") {
                updatedValue = value.replace(/\D/g, "");
            }
            if (name === "accountHolderName") {
                updatedValue = value.replace(/[^a-zA-Z\s]/g, "");
            }
            if (name === "aadharNumber") {
                updatedValue = value.replace(/\D/g, "").slice(0, 12);
            }

            if (name === "panNumber") {
                updatedValue = value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 10);
            }

            // Phone numbers: digits only, maximum 10 digits
            if (
                name === "phone" ||
                name === "emergencyPhone"
            ) {
                updatedValue =
                    value
                        .replace(/\D/g, "")
                        .slice(0, 10);
            }

            setFormData((prev) => {
                const newState = {
                    ...prev,
                    [name]: updatedValue,
                };

                // Regenerate employee ID if role changes
                if (name === "role") {
                    if (
                        !editingUser ||
                        (editingUser &&
                            updatedValue !==
                            editingUser.role)
                    ) {
                        newState.employeeId =
                            generateEmployeeId(
                                updatedValue as Role,
                                allUsers
                            );
                    }

                    // Automatically set sensible default department
                    // and position if creating a new user
                    if (!editingUser) {
                        if (
                            updatedValue ===
                            Role.HR
                        ) {
                            newState.department =
                                "HR";

                            if (
                                !newState.position
                            ) {
                                newState.position =
                                    "HR Manager";
                            }
                        } else if (
                            updatedValue ===
                            Role.VISITOR
                        ) {
                            newState.department =
                                "Visitor";
                        } else if (
                            updatedValue ===
                            Role.ADMIN
                        ) {
                            newState.department =
                                "Management";
                        }
                    }
                }

                return newState;
            });
        };

        const handlePhotoChange = async (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            if (
                e.target.files &&
                e.target.files[0]
            ) {
                const file =
                    e.target.files[0];

                const toastId =
                    toast.loading(
                        "Uploading photo to Cloudinary..."
                    );

                try {
                    const url =
                        await uploadToCloudinary(
                            file,
                            "ams_profiles"
                        );

                    setFormData((prev) => ({
                        ...prev,
                        profilePhoto: url,
                    }));

                    toast.success(
                        "Photo uploaded to Cloudinary successfully!",
                        {
                            id: toastId,
                        }
                    );
                } catch (err: any) {
                    console.warn(
                        "Cloudinary photo upload failed, using local preview fallback:",
                        err
                    );

                    const reader =
                        new FileReader();

                    reader.onloadend = () => {
                        setFormData(
                            (prev) => ({
                                ...prev,
                                profilePhoto:
                                    reader.result as string,
                            })
                        );
                    };

                    reader.readAsDataURL(file);

                    toast.error(
                        `Cloudinary: ${err?.message ||
                        "Upload failed"
                        }. Preview saved.`,
                        {
                            id: toastId,
                        }
                    );
                }
            }
        };

        const handleDocumentChange = async (
            e: React.ChangeEvent<HTMLInputElement>,
            fieldName:
                | "aadharDocument"
                | "panDocument"
                | "bankDocument"
                | "otherDocument"
        ) => {
            if (
                e.target.files &&
                e.target.files[0]
            ) {
                const file =
                    e.target.files[0];

                setUploadingDocs(
                    (prev) => ({
                        ...prev,
                        [fieldName]: true,
                    })
                );

                const toastId =
                    toast.loading(
                        "Uploading document to Cloudinary..."
                    );

                try {
                    const url =
                        await uploadToCloudinary(
                            file,
                            "ams_documents"
                        );

                    setFormData(
                        (prev) => ({
                            ...prev,
                            [fieldName]: url,
                        })
                    );

                    toast.success(
                        "Document uploaded to Cloudinary successfully!",
                        {
                            id: toastId,
                        }
                    );
                } catch (error: any) {
                    console.error(
                        `Error uploading ${fieldName}:`,
                        error
                    );

                    toast.error(
                        `Cloudinary: ${error?.message ||
                        "Failed to upload document."
                        }`,
                        {
                            id: toastId,
                        }
                    );
                } finally {
                    setUploadingDocs(
                        (prev) => ({
                            ...prev,
                            [fieldName]:
                                false,
                        })
                    );

                    e.target.value = "";
                }
            }
        };

        const handleRemoveFormField = (
            fieldName:
                | "aadharDocument"
                | "panDocument"
                | "bankDocument"
                | "otherDocument"
        ) => {
            setFormData((prev) => ({
                ...prev,
                [fieldName]: "",
            }));
        };

        const handleSubmit = async (
            e: React.FormEvent
        ) => {
            e.preventDefault();

            // Normalize values before validation
            const email = String(
                formData.email || ""
            )
                .trim()
                .toLowerCase();

            const phone = String(
                formData.phone || ""
            )
                .replace(/\D/g, "")
                .slice(0, 10);

            const emergencyPhone =
                String(
                    formData.emergencyPhone ||
                    ""
                )
                    .replace(/\D/g, "")
                    .slice(0, 10);

            // Email validation
            if (!email) {
                toast.error(
                    "Email is required."
                );
                return;
            }

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {
                toast.error(
                    "Please enter a valid email address."
                );
                return;
            }

            // Phone validation
            if (!phone) {
                toast.error(
                    "Phone number is required."
                );
                return;
            }

            if (phone.length > 10) {
                toast.error(
                    "Phone number cannot exceed 10 digits."
                );
                return;
            }

            // Emergency phone validation
            if (
                emergencyPhone &&
                emergencyPhone.length > 10
            ) {
                toast.error(
                    "Emergency phone number cannot exceed 10 digits."
                );
                return;
            }

            // Keep normalized values in form state
            const normalizedFormData = {
                ...formData,
                email,
                phone,
                emergencyPhone,
            };

            setFormData(
                normalizedFormData
            );

            setIsSaving(true);

            try {
                if (editingUser) {
                    const userRef = doc(
                        db,
                        "users",
                        editingUser.id
                    );

                    const {
                        password,
                        ...updateData
                    } = normalizedFormData;

                    await updateDoc(
                        userRef,
                        updateData as any
                    );

                    logAuditEvent({
                        actionType:
                            AuditActionType.PROFILE_UPDATE,
                        userId:
                            editingUser.id,
                        userName:
                            normalizedFormData.name,
                        details: `Profile updated by admin/HR. Role: ${normalizedFormData.role}`,
                    });

                    toast.success(
                        "User updated successfully!"
                    );
                } else {
                    // Create user in Firebase Auth
                    const userCred =
                        await createUserWithEmailAndPassword(
                            secondaryAuth,
                            normalizedFormData.email,
                            normalizedFormData.password ||
                            "password123"
                        );

                    // Save profile to Firestore
                    const {
                        password,
                        ...profileData
                    } = normalizedFormData;

                    await setDoc(
                        doc(
                            db,
                            "users",
                            userCred.user.uid
                        ),
                        profileData
                    );

                    logAuditEvent({
                        actionType:
                            AuditActionType.USER_CREATED,
                        userId:
                            userCred.user.uid,
                        userName:
                            normalizedFormData.name,
                        details: `New user created by admin/HR. Role: ${normalizedFormData.role}`,
                    });

                    toast.success(
                        "User added successfully!"
                    );
                }

                onSuccess();
                onClose();
            } catch (error: any) {
                console.error(
                    "Error saving user:",
                    error
                );

                toast.error(
                    error?.message ||
                    "Failed to save user."
                );
            } finally {
                setIsSaving(false);
            }
        };

        if (!isOpen) return null;

        const roleOptions: CustomSelectOption[] =
            Object.values(Role).map(
                (role) => ({
                    value: role,
                    label: role,
                    disabled:
                        role === Role.ADMIN &&
                        editingUser?.role !==
                        Role.ADMIN &&
                        !editingUser,
                })
            );

        const departmentOptions: CustomSelectOption[] =
            [
                {
                    value: "",
                    label: "Select Department",
                },
                {
                    value: "HR",
                    label: "HR",
                },
                {
                    value: "Management",
                    label: "Management",
                },
                {
                    value: "Development",
                    label: "Development",
                },
                {
                    value: "SEO",
                    label: "SEO",
                },
                {
                    value: "Product",
                    label: "Product",
                },
                {
                    value: "Media",
                    label: "Media",
                },
                {
                    value: "Sales",
                    label: "Sales",
                },
                {
                    value: "Visitor",
                    label: "Visitor",
                },
            ];

        const bloodGroupOptions: CustomSelectOption[] =
            [
                {
                    value: "",
                    label: "Select Blood Group",
                },
                {
                    value: "A+",
                    label: "A+",
                },
                {
                    value: "A-",
                    label: "A-",
                },
                {
                    value: "B+",
                    label: "B+",
                },
                {
                    value: "B-",
                    label: "B-",
                },
                {
                    value: "O+",
                    label: "O+",
                },
                {
                    value: "O-",
                    label: "O-",
                },
                {
                    value: "AB+",
                    label: "AB+",
                },
                {
                    value: "AB-",
                    label: "AB-",
                },
            ];

        const statusOptions: CustomSelectOption[] =
            [
                {
                    value: UserStatus.ACTIVE,
                    label: "Active",
                },
                {
                    value: UserStatus.INACTIVE,
                    label: "Inactive",
                },
            ];

        return createPortal(
            <div
                onClick={onClose}
                className="
                fixed inset-0
                bg-transparent
                flex justify-center items-center
                z-[9999]
                p-2 sm:p-4
                animate-in fade-in duration-200
            "
            >
                <div
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                    className="
                    bg-white
                    rounded-2xl
                    shadow-2xl
                    border border-slate-200
                    p-0
                    w-full
                    max-w-2xl
                    max-h-[94vh]
                    overflow-hidden
                    flex flex-col
                    animate-in zoom-in-95 duration-200
                "
                >
                    {/* Modal Header */}
                    <div className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex-shrink-0">
                        <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                                {editingUser
                                    ? "Edit Profile"
                                    : `New ${formData.role ||
                                    "User"
                                    }`}
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-500 truncate">
                                {editingUser
                                    ? "Update account details"
                                    : `Create a new ${formData.role
                                        ? formData.role.toLowerCase()
                                        : "staff"
                                    } account`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="
                            flex-shrink-0
                            p-2
                            hover:bg-slate-50
                            rounded-full
                            text-slate-400
                            hover:text-slate-900
                            transition-colors
                        "
                        >
                            <X
                                size={20}
                                className="sm:w-6 sm:h-6"
                            />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <form
                        id="user-form"
                        onSubmit={handleSubmit}
                        className="
                        flex-1
                        overflow-y-auto
                        overflow-x-hidden
                        custom-scrollbar
                        p-4 sm:p-8
                        pt-4 sm:pt-6
                    "
                    >
                        <div className="space-y-8">

                            {/* Photo & Basic Info Section */}
                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center gap-4 flex-shrink-0">
                                    <div className="relative group">
                                        <img
                                            src={
                                                formData.profilePhoto ||
                                                "https://via.placeholder.com/150"
                                            }
                                            alt="Profile Preview"
                                            className="
                                            w-32 h-32
                                            rounded-[2.5rem]
                                            object-cover
                                            border-4 border-slate-50
                                            shadow-md
                                            group-hover:opacity-90
                                            transition-opacity
                                        "
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="
                                            absolute inset-0
                                            flex items-center
                                            justify-center
                                            opacity-0
                                            group-hover:opacity-100
                                            transition-opacity
                                        "
                                        >
                                            <div className="bg-black/40 backdrop-blur-sm p-2 rounded-full text-white">
                                                <UploadCloud
                                                    size={20}
                                                />
                                            </div>
                                        </button>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={
                                            handlePhotoChange
                                        }
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="
                                        text-xs
                                        font-bold
                                        text-indigo-600
                                        hover:text-indigo-800
                                        tracking-wide
                                        uppercase
                                    "
                                    >
                                        Change Photo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow w-full">
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FormInput
                                            label="Full Name"
                                            name="name"
                                            value={
                                                formData.name
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                            placeholder="John Doe"
                                        />

                                        <FormInput
                                            label="Email Address"
                                            name="email"
                                            type="email"
                                            value={
                                                formData.email
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <FormInput
                                        label="Date of Birth"
                                        name="dob"
                                        type="date"
                                        value={
                                            formData.dob ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                    />

                                    <FormInput
                                        label="Joining Date"
                                        name="joiningDate"
                                        type="date"
                                        value={
                                            formData.joiningDate ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                    />
                                </div>
                            </div>

                            {/* Professional Info Section */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Briefcase
                                        size={16}
                                        className="text-indigo-600"
                                    />

                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                        Professional Details
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {/* Role */}
                                    <CustomSelect
                                        label="Role"
                                        value={
                                            formData.role
                                        }
                                        options={
                                            roleOptions
                                        }
                                        onChange={(
                                            value
                                        ) => {
                                            handleInputChange({
                                                target: {
                                                    name: "role",
                                                    value,
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>);
                                        }}
                                        disabled={
                                            !!editingUser &&
                                            editingUser.role ===
                                            Role.ADMIN
                                        }
                                        required
                                    />

                                    <FormInput
                                        label="Employee ID"
                                        name="employeeId"
                                        value={
                                            formData.employeeId
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                        readOnly
                                        className="
                                        !bg-slate-100
                                        !text-slate-500
                                        cursor-not-allowed
                                        font-mono
                                    "
                                    />

                                    {/* Department */}
                                    <CustomSelect
                                        label="Department"
                                        value={
                                            formData.department ||
                                            ""
                                        }
                                        options={
                                            departmentOptions
                                        }
                                        onChange={(
                                            value
                                        ) => {
                                            handleInputChange({
                                                target: {
                                                    name: "department",
                                                    value,
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>);
                                        }}
                                        required
                                        placeholder="Select Department"
                                    />

                                    <FormInput
                                        label="Position"
                                        name="position"
                                        value={
                                            formData.position ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder={
                                            formData.role ===
                                                Role.HR
                                                ? "e.g., HR Manager / Executive"
                                                : "e.g., Senior Developer"
                                        }
                                    />

                                    <FormInput
                                        label="Phone Number"
                                        name="phone"
                                        type="tel"
                                        value={
                                            formData.phone
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                        maxLength={10}
                                        inputMode="numeric"
                                        placeholder="9876543210"
                                    />

                                    <FormInput
                                        label="Emergency Contact (Optional)"
                                        name="emergencyPhone"
                                        type="tel"
                                        value={
                                            formData.emergencyPhone ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        maxLength={10}
                                        inputMode="numeric"
                                        placeholder="9876543210"
                                    />

                                    {(formData.department ===
                                        "Visitor" ||
                                        formData.role ===
                                        Role.VISITOR) && (
                                            <FormInput
                                                label="Company Name (Optional)"
                                                name="companyName"
                                                value={
                                                    formData.companyName ||
                                                    ""
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                                placeholder="Enter Company Name"
                                            />
                                        )}

                                    {/* Blood Group */}
                                    <CustomSelect
                                        label="Blood Group"
                                        value={
                                            formData.bloodGroup ||
                                            ""
                                        }
                                        options={
                                            bloodGroupOptions
                                        }
                                        onChange={(
                                            value
                                        ) => {
                                            handleInputChange({
                                                target: {
                                                    name: "bloodGroup",
                                                    value,
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>);
                                        }}
                                        required
                                        placeholder="Select Blood Group"
                                    />
                                </div>
                            </div>

                            {/* Bank Details Section */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2
                                        size={16}
                                        className="text-indigo-600"
                                    />

                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                        Bank Information
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormInput
                                        label="Bank Name"
                                        name="bankName"
                                        value={
                                            formData.bankName ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder="e.g. HDFC Bank"
                                    />

                                    <FormInput
                                        label="Account Number"
                                        name="accountNumber"
                                        value={
                                            formData.accountNumber ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder="XXXXXXXXXXXX"
                                    />

                                    <FormInput
                                        label="IFSC Code"
                                        name="ifscCode"
                                        value={
                                            formData.ifscCode ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder="HDFC0001234"
                                    />

                                    <FormInput
                                        label="Account Holder Name"
                                        name="accountHolderName"
                                        value={
                                            formData.accountHolderName ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder="As per bank records"
                                    />
                                </div>
                            </div>

                            {/* Documents & IDs Section */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText
                                        size={16}
                                        className="text-indigo-600"
                                    />

                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                        Documents & IDs
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormInput
                                        label="Aadhar Number"
                                        name="aadharNumber"
                                        value={
                                            formData.aadharNumber ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder="12-digit UID"
                                    />

                                    <FormInput
                                        label="PAN Number"
                                        name="panNumber"
                                        value={
                                            formData.panNumber ||
                                            ""
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        placeholder="10-digit PAN"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                                    <DocumentUploadField
                                        label="Aadhar Card"
                                        value={
                                            formData.aadharDocument
                                        }
                                        onChange={(e: any) =>
                                            handleDocumentChange(
                                                e,
                                                "aadharDocument"
                                            )
                                        }
                                        onRemove={() =>
                                            handleRemoveFormField(
                                                "aadharDocument"
                                            )
                                        }
                                        inputRef={
                                            aadharDocRef
                                        }
                                        isUploading={
                                            uploadingDocs.aadharDocument
                                        }
                                    />

                                    <DocumentUploadField
                                        label="PAN Card"
                                        value={
                                            formData.panDocument
                                        }
                                        onChange={(e: any) =>
                                            handleDocumentChange(
                                                e,
                                                "panDocument"
                                            )
                                        }
                                        onRemove={() =>
                                            handleRemoveFormField(
                                                "panDocument"
                                            )
                                        }
                                        inputRef={
                                            panDocRef
                                        }
                                        isUploading={
                                            uploadingDocs.panDocument
                                        }
                                    />

                                    <DocumentUploadField
                                        label="Bank Proof"
                                        value={
                                            formData.bankDocument
                                        }
                                        onChange={(e: any) =>
                                            handleDocumentChange(
                                                e,
                                                "bankDocument"
                                            )
                                        }
                                        onRemove={() =>
                                            handleRemoveFormField(
                                                "bankDocument"
                                            )
                                        }
                                        inputRef={
                                            bankDocRef
                                        }
                                        placeholder="Cheque / Passbook"
                                        isUploading={
                                            uploadingDocs.bankDocument
                                        }
                                    />

                                    <DocumentUploadField
                                        label="Address Proof"
                                        value={
                                            formData.otherDocument
                                        }
                                        onChange={(e: any) =>
                                            handleDocumentChange(
                                                e,
                                                "otherDocument"
                                            )
                                        }
                                        onRemove={() =>
                                            handleRemoveFormField(
                                                "otherDocument"
                                            )
                                        }
                                        inputRef={
                                            otherDocRef
                                        }
                                        placeholder="Utility Bill / Rent Agmt"
                                        isUploading={
                                            uploadingDocs.otherDocument
                                        }
                                    />
                                </div>
                            </div>

                            {/* Account Access Section */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle
                                        size={16}
                                        className="text-indigo-600"
                                    />

                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                        System Access & Security
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {/* Account Status */}
                                    <CustomSelect
                                        label="Account Status"
                                        value={
                                            formData.status ||
                                            UserStatus.ACTIVE
                                        }
                                        options={
                                            statusOptions
                                        }
                                        onChange={(
                                            value
                                        ) => {
                                            handleInputChange({
                                                target: {
                                                    name: "status",
                                                    value,
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>);
                                        }}
                                    />

                                    {/* Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Password
                                        </label>

                                        {!editingUser ? (
                                            <div className="relative">
                                                <input
                                                    name="password"
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={
                                                        formData.password ||
                                                        ""
                                                    }
                                                    onChange={
                                                        handleInputChange
                                                    }
                                                    placeholder="Minimum 6 characters"
                                                    required
                                                    minLength={6}
                                                    className="
                                                    w-full
                                                    h-[52px]
                                                    px-4 py-3
                                                    rounded-xl
                                                    border border-slate-300
                                                    bg-white
                                                    text-slate-800
                                                    placeholder:text-slate-400
                                                    font-medium
                                                    transition-all
                                                    outline-none
                                                    hover:border-slate-400
                                                    focus:border-indigo-600
                                                    focus:ring-4
                                                    focus:ring-indigo-500/15
                                                    shadow-sm
                                                    pr-12
                                                "
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword
                                                        )
                                                    }
                                                    className="
                                                    absolute
                                                    right-4
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-slate-400
                                                    hover:text-slate-600
                                                "
                                                >
                                                    {showPassword ? (
                                                        <EyeOff
                                                            size={18}
                                                        />
                                                    ) : (
                                                        <Eye
                                                            size={18}
                                                        />
                                                    )}
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
                    <div className="
                    px-4 sm:px-8
                    py-4 sm:py-5
                    bg-slate-50
                    border-t border-slate-100
                    flex flex-col-reverse
                    sm:flex-row
                    justify-end
                    gap-2 sm:gap-3
                    flex-shrink-0
                ">
                        <button
                            type="button"
                            onClick={onClose}
                            className="
                            w-full sm:w-auto
                            px-6 py-2.5
                            text-slate-600
                            font-bold
                            hover:bg-slate-100
                            rounded-xl
                            transition-all
                            text-sm
                        "
                            disabled={isSaving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="user-form"
                            disabled={isSaving}
                            className="
                            w-full sm:w-auto
                            px-8 py-2.5
                            bg-indigo-600
                            hover:bg-indigo-700
                            text-white
                            rounded-xl
                            font-bold
                            shadow-lg
                            shadow-indigo-200
                            transition-all
                            active:scale-95
                            disabled:opacity-50
                            text-sm
                        "
                        >
                            {isSaving
                                ? "Saving..."
                                : editingUser
                                    ? "Update Profile"
                                    : "Create User"}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

export default UserFormModal;