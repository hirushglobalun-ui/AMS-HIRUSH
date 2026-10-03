/**
 * @file ManageMessages.tsx
 * @description React component for rendering ManageMessages UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

"use client";

import React, { useState, useEffect } from "react";
import Card from "../common/Card";
import { toast } from "react-hot-toast";
import { db } from "../../firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    getDocs,
} from "firebase/firestore";
import { User, Message } from "../../types";
import {
    Send,
    Inbox,
    Users,
    Building2,
    User as UserIcon,
    Mail,
    Search,
    CheckCircle2,
    X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const ManageMessages: React.FC = () => {
    const { user: admin } = useAuth();

    const formInputClasses =
        "mt-1 block w-full min-w-0 max-w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10";

    const [recipientType, setRecipientType] = useState("all");
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
    const [viewingMessage, setViewingMessage] =
        useState<Message | null>(null);
    const [sendEmailNotification, setSendEmailNotification] =
        useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);

                const userList: User[] = [];

                snapshot.forEach((doc) => {
                    userList.push({
                        id: doc.id,
                        ...doc.data(),
                    } as User);
                });

                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    const adminId = admin?.id;
    const adminRole = admin?.role;

    useEffect(() => {
        if (!adminId) return;

        const messagesRef = collection(db, "messages");
        const q = query(
            messagesRef,
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const msgs: Message[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();

                    const msg = {
                        id: doc.id,
                        ...data,
                    } as Message;

                    if (
                        msg.recipient === "all" ||
                        (typeof msg.recipient === "string" &&
                            msg.recipient === adminRole) ||
                        (Array.isArray(msg.recipient) &&
                            msg.recipient.includes(adminId)) ||
                        msg.senderId === adminId
                    ) {
                        msgs.push(msg);
                    }
                });

                msgs.sort((a, b) => {
                    const getVal = (m: Message) => {
                        if (
                            m.timestamp &&
                            typeof m.timestamp.toDate ===
                            "function"
                        ) {
                            return m.timestamp
                                .toDate()
                                .getTime();
                        }

                        return Date.now();
                    };

                    return getVal(b) - getVal(a);
                });

                setReceivedMessages(msgs);
            },
            (error) => {
                console.error(
                    "Error listening to messages:",
                    error
                );

                toast.error("Failed to sync messages.");
            }
        );

        return () => unsubscribe();
    }, [adminId, adminRole]);

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!admin) return;

        const form = e.currentTarget;
        const formData = new FormData(form);

        let recipient: string | string[] = "all";

        const recipientTypeValue =
            formData.get("recipientType");

        if (recipientTypeValue === "all") {
            recipient = "all";
        } else if (
            recipientTypeValue === "department"
        ) {
            const dept = formData.get("department");

            recipient =
                typeof dept === "string"
                    ? dept.trim()
                    : "";

            if (!recipient) {
                toast.error("Please select a department");
                return;
            }
        } else if (
            recipientTypeValue === "individual"
        ) {
            const selected = formData.get(
                "selectedUsers"
            );

            recipient =
                typeof selected === "string"
                    ? selected
                        .split(",")
                        .filter((id) => id.trim())
                    : [];

            if (
                !Array.isArray(recipient) ||
                recipient.length === 0
            ) {
                toast.error(
                    "Please select at least one user"
                );
                return;
            }
        }

        const newMessage = {
            title: formData.get("title"),
            content: formData.get("content"),
            imageUrl: formData.get("imageUrl"),
            recipient,
            recipientType: recipientTypeValue,
            timestamp: serverTimestamp(),
            senderId: admin.id,
            senderName: admin.name || "Admin",
        };

        setSending(true);

        try {
            await addDoc(
                collection(db, "messages"),
                newMessage
            );

            if (sendEmailNotification) {
                let targetEmails: string[] = [];
                let targetLabel = "All Employees";

                if (recipientTypeValue === "all") {
                    targetEmails = users
                        .filter(
                            (u) =>
                                u.status !== "Inactive" &&
                                u.email
                        )
                        .map((u) => u.email.trim());

                    targetLabel = "All Employees";
                } else if (
                    recipientTypeValue === "department"
                ) {
                    const deptName =
                        typeof recipient === "string"
                            ? recipient
                            : "";

                    targetEmails = users
                        .filter(
                            (u) =>
                                u.status !== "Inactive" &&
                                u.department === deptName &&
                                u.email
                        )
                        .map((u) => u.email.trim());

                    targetLabel =
                        `Department: ${deptName}`;
                } else if (
                    recipientTypeValue === "individual"
                ) {
                    const selectedIds =
                        Array.isArray(recipient)
                            ? recipient
                            : [recipient];

                    targetEmails = users
                        .filter(
                            (u) =>
                                selectedIds.includes(u.id) &&
                                u.email
                        )
                        .map((u) => u.email.trim());

                    targetLabel = "Direct Message";
                }

                if (targetEmails.length > 0) {
                    try {
                        const emailRes = await fetch(
                            "/api/send-message-email",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify({
                                    title: newMessage.title,
                                    content:
                                        newMessage.content,
                                    imageUrl:
                                        newMessage.imageUrl,
                                    senderName:
                                        admin.name ||
                                        "Hirush Global Admin",
                                    senderRole:
                                        admin.role || "Admin",
                                    recipientType:
                                        recipientTypeValue,
                                    targetLabel,
                                    recipients:
                                        targetEmails,
                                }),
                            }
                        );

                        if (emailRes.ok) {
                            toast.success(
                                `Message sent and emails dispatched to ${targetEmails.length} recipient(s)!`
                            );
                        } else {
                            toast.success(
                                "Message sent to AMS (email notification service reported an error)."
                            );
                        }
                    } catch (emailErr) {
                        console.error(
                            "Failed to call email API:",
                            emailErr
                        );

                        toast.success(
                            "Message sent to AMS successfully."
                        );
                    }
                } else {
                    toast.success(
                        "Message sent to AMS (no active email addresses found for recipient)."
                    );
                }
            } else {
                toast.success(
                    "Message sent successfully!"
                );
            }

            form.reset();

            setRecipientType("all");
            setSelectedUsers([]);
            setUserSearch("");
        } catch (error) {
            console.error(
                "Error sending message:",
                error
            );

            toast.error("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (
            timestamp &&
            typeof timestamp.toDate === "function"
        ) {
            return timestamp.toDate().toLocaleString();
        }

        return "Just now";
    };

    if (!admin) return null;

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* =====================================================
                    COMPOSE SECTION
                ====================================================== */}
                <Card className="flex flex-col w-full min-w-0 max-w-full overflow-visible">
                    <div className="flex items-center gap-3 mb-6 flex-shrink-0 min-w-0">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Send size={24} />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-900 truncate">
                                Compose Message
                            </h2>

                            <p className="text-sm text-slate-500 break-words">
                                Send announcements or direct
                                messages
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5 w-full min-w-0 max-w-full"
                    >
                        {/* Recipient Type Tabs */}
                        <div className="grid grid-cols-3 gap-2 w-full min-w-0">
                            {[
                                {
                                    id: "all",
                                    label: "Everyone",
                                    icon: Users,
                                },
                                {
                                    id: "department",
                                    label: "Department",
                                    icon: Building2,
                                },
                                {
                                    id: "individual",
                                    label: "Individual",
                                    icon: UserIcon,
                                },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() =>
                                        setRecipientType(
                                            type.id
                                        )
                                    }
                                    className={`min-w-0 w-full flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${recipientType ===
                                            type.id
                                            ? "border-primary bg-primary/5 text-primary font-bold shadow-sm ring-1 ring-primary/20"
                                            : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:bg-slate-50"
                                        }`}
                                >
                                    <type.icon
                                        size={20}
                                        className="shrink-0"
                                    />

                                    <span className="text-xs font-semibold truncate max-w-full">
                                        {type.label}
                                    </span>
                                </button>
                            ))}

                            <input
                                type="hidden"
                                name="recipientType"
                                value={recipientType}
                            />
                        </div>

                        <div className="space-y-4 w-full min-w-0">
                            {/* Subject */}
                            <div className="w-full min-w-0">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                    Subject
                                </label>

                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    placeholder="Enter message subject"
                                    className={formInputClasses}
                                    required
                                />
                            </div>

                            {/* Department */}
                            {recipientType ===
                                "department" && (
                                    <div className="animate-in fade-in slide-in-from-top-2 w-full min-w-0">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                            Select Department
                                        </label>

                                        <select
                                            id="department"
                                            name="department"
                                            className={`${formInputClasses} appearance-none cursor-pointer`}
                                            defaultValue=""
                                            required
                                        >
                                            <option value="">
                                                Select Department
                                            </option>

                                            <option value="HR">
                                                HR
                                            </option>

                                            <option value="Management">
                                                Management
                                            </option>

                                            <option value="SEO">
                                                SEO
                                            </option>

                                            <option value="Development">
                                                Development
                                            </option>

                                            <option value="Product">
                                                Product
                                            </option>

                                            <option value="Media">
                                                Media
                                            </option>

                                            <option value="Sales">
                                                Sales
                                            </option>

                                            <option value="Visitor">
                                                Visitor
                                            </option>
                                        </select>
                                    </div>
                                )}

                            {/* Individual Users */}
                            {recipientType ===
                                "individual" && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 w-full min-w-0">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                            Select Users
                                        </label>

                                        <div className="relative w-full min-w-0">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                                size={18}
                                            />

                                            <input
                                                type="text"
                                                placeholder="Search by name or ID..."
                                                className="w-full min-w-0 max-w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                value={userSearch}
                                                onChange={(e) =>
                                                    setUserSearch(
                                                        e.target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="w-full min-w-0 max-w-full max-h-48 overflow-y-auto overflow-x-hidden border border-slate-300 rounded-xl p-2 bg-white space-y-1 custom-scrollbar">
                                            {users
                                                .filter(
                                                    (user) =>
                                                        user.name
                                                            .toLowerCase()
                                                            .includes(
                                                                userSearch.toLowerCase()
                                                            ) ||
                                                        (user.employeeId &&
                                                            user.employeeId
                                                                .toLowerCase()
                                                                .includes(
                                                                    userSearch.toLowerCase()
                                                                ))
                                                )
                                                .map((user) => (
                                                    <label
                                                        key={user.id}
                                                        className={`flex items-center min-w-0 w-full p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(
                                                            user.id
                                                        )
                                                                ? "bg-primary/5 text-primary"
                                                                : "hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={selectedUsers.includes(
                                                                user.id
                                                            )}
                                                            onChange={(
                                                                e
                                                            ) => {
                                                                if (
                                                                    e
                                                                        .target
                                                                        .checked
                                                                ) {
                                                                    setSelectedUsers(
                                                                        [
                                                                            ...selectedUsers,
                                                                            user.id,
                                                                        ]
                                                                    );
                                                                } else {
                                                                    setSelectedUsers(
                                                                        selectedUsers.filter(
                                                                            (
                                                                                id
                                                                            ) =>
                                                                                id !==
                                                                                user.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                        />

                                                        <div
                                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 shrink-0 transition-all ${selectedUsers.includes(
                                                                user.id
                                                            )
                                                                    ? "bg-primary border-primary"
                                                                    : "border-slate-300"
                                                                }`}
                                                        >
                                                            {selectedUsers.includes(
                                                                user.id
                                                            ) && (
                                                                    <CheckCircle2
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-white"
                                                                    />
                                                                )}
                                                        </div>

                                                        <span className="text-sm font-medium truncate min-w-0">
                                                            {user.name}
                                                        </span>

                                                        <span className="text-xs text-slate-400 ml-auto pl-2 shrink-0">
                                                            {user.employeeId ||
                                                                "No ID"}
                                                        </span>
                                                    </label>
                                                ))}
                                        </div>

                                        <input
                                            type="hidden"
                                            name="selectedUsers"
                                            value={selectedUsers.join(
                                                ","
                                            )}
                                        />
                                    </div>
                                )}

                            {/* Message Content */}
                            <div className="w-full min-w-0">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                    Message Content
                                </label>

                                <textarea
                                    id="content"
                                    name="content"
                                    rows={4}
                                    placeholder="Type your message here..."
                                    className="w-full min-w-0 max-w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                                    required
                                />
                            </div>

                            {/* Image URL */}
                            <div className="w-full min-w-0">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                    Image URL (Optional)
                                </label>

                                <input
                                    type="url"
                                    id="imageUrl"
                                    name="imageUrl"
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full min-w-0 max-w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Email Notification */}
                        <div className="pt-1 w-full min-w-0">
                            <label className="flex items-start gap-3 p-3 bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors w-full min-w-0">
                                <input
                                    type="checkbox"
                                    checked={
                                        sendEmailNotification
                                    }
                                    onChange={(e) =>
                                        setSendEmailNotification(
                                            e.target.checked
                                        )
                                    }
                                    className="w-4 h-4 mt-0.5 shrink-0 text-primary rounded border border-slate-300 focus:ring-primary cursor-pointer"
                                />

                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-start gap-1.5 break-words">
                                        <Mail
                                            size={16}
                                            className="text-primary shrink-0 mt-0.5"
                                        />

                                        <span>
                                            Send Email Notification
                                            to Recipients
                                        </span>
                                    </span>

                                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                                        Dispatches a branded
                                        Hirush Global email
                                        directly to employee
                                        inboxes
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="pt-2 w-full min-w-0">
                            <button
                                type="submit"
                                disabled={sending}
                                className={`w-full min-w-0 flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] ${sending
                                        ? "opacity-70 cursor-not-allowed"
                                        : "cursor-pointer"
                                    }`}
                            >
                                <Send
                                    size={18}
                                    className={
                                        sending
                                            ? "animate-pulse"
                                            : ""
                                    }
                                />

                                <span className="truncate">
                                    {sending
                                        ? "Sending & Dispatching Emails..."
                                        : "Send Message"}
                                </span>
                            </button>
                        </div>
                    </form>
                </Card>

                {/* =====================================================
                    INBOX SECTION
                ====================================================== */}
                <Card className="flex flex-col w-full min-w-0 max-w-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 flex-shrink-0 min-w-0">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                            <Inbox size={24} />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-900">
                                Inbox
                            </h2>

                            <p className="text-sm text-slate-500 break-words">
                                Messages sent to you{" "}
                                {admin.role === "Admin"
                                    ? "(Admin)"
                                    : ""}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-250px)] custom-scrollbar overflow-y-auto overflow-x-hidden pr-1 pb-4 min-w-0">
                        {receivedMessages.length > 0 ? (
                            receivedMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() =>
                                        setViewingMessage(
                                            msg
                                        )
                                    }
                                    className="group p-5 border border-slate-300 rounded-2xl bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer min-w-0 max-w-full overflow-hidden"
                                >
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary rounded-lg transition-colors shrink-0">
                                            <Mail size={18} />
                                        </div>

                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-tight shrink-0 max-w-[60%] truncate">
                                            {formatTimestamp(
                                                msg.timestamp
                                            )}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors mb-1 break-words">
                                        {msg.title}
                                    </h3>

                                    <p className="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-1 min-w-0">
                                        <UserIcon
                                            size={12}
                                            className="shrink-0"
                                        />

                                        <span className="truncate">
                                            From:{" "}
                                            {msg.senderName ||
                                                "Unknown"}
                                        </span>
                                    </p>

                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 break-words">
                                        {msg.content}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[400px] text-center px-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Inbox size={32} />
                                </div>

                                <p className="text-lg font-medium">
                                    No messages received yet.
                                </p>

                                <p className="text-sm">
                                    Announcements will appear
                                    here.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* =====================================================
                    MESSAGE DETAIL MODAL
                ====================================================== */}
                {viewingMessage && (
                    <div
                        onClick={() =>
                            setViewingMessage(null)
                        }
                        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/30 animate-in fade-in duration-200 overflow-y-auto"
                    >
                        <div
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                            className="bg-white w-full max-w-2xl max-h-[95vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-300 overflow-hidden animate-in zoom-in-95 duration-200 min-w-0"
                        >
                            {/* Modal Header */}
                            <div className="relative p-4 sm:p-6 border-b border-slate-200">
                                <button
                                    onClick={() =>
                                        setViewingMessage(
                                            null
                                        )
                                    }
                                    className="absolute right-3 top-3 sm:right-6 sm:top-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-start gap-3 sm:gap-4 mb-2 pr-10 min-w-0">
                                    <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
                                        <Mail size={24} />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 break-words">
                                            {
                                                viewingMessage.title
                                            }
                                        </h3>

                                        <p className="text-sm text-slate-400 flex items-start gap-1 mt-1 break-words">
                                            <UserIcon
                                                size={14}
                                                className="shrink-0 mt-0.5"
                                            />

                                            <span>
                                                Sent by{" "}
                                                {viewingMessage.senderName ||
                                                    "Unknown"}{" "}
                                                •{" "}
                                                {formatTimestamp(
                                                    viewingMessage.timestamp
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 sm:p-8 max-h-[65vh] overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0">
                                <div className="prose prose-slate max-w-none min-w-0">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg break-words">
                                        {
                                            viewingMessage.content
                                        }
                                    </p>

                                    {(viewingMessage as any)
                                        .imageUrl && (
                                            <div className="mt-6 rounded-2xl overflow-hidden border border-slate-300 shadow-sm max-w-full">
                                                <img
                                                    src={
                                                        (
                                                            viewingMessage as any
                                                        )
                                                            .imageUrl
                                                    }
                                                    alt="Message attachment"
                                                    className="w-full h-auto max-w-full object-cover"
                                                />
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 bg-slate-50 flex justify-end border-t border-slate-200">
                                <button
                                    onClick={() =>
                                        setViewingMessage(
                                            null
                                        )
                                    }
                                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Responsive Protection */}
            <style jsx>{`
                @media (max-width: 767px) {
                    input,
                    select,
                    textarea {
                        width: 100%;
                        max-width: 100%;
                        min-width: 0;
                        box-sizing: border-box;
                    }

                    form,
                    form > div,
                    .grid {
                        min-width: 0;
                        max-width: 100%;
                    }

                    select {
                        width: 100%;
                    }

                    textarea {
                        overflow-wrap: anywhere;
                    }
                }
            `}</style>
        </div>
    );
};

export default ManageMessages;