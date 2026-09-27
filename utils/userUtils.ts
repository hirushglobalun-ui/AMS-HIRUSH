/**
 * File: userUtils.ts
 * Purpose: Provides reusable utility functions and constants for User management.
 * Layer: Utils
 * Notes: Refactored for production readiness without behavior change.
 */

import { Role, User, UserStatus } from '../types';

/**
 * Purpose: Generates a unique sequential employee ID based on role.
 * Input: role (Role), allUsers (User array)
 * Output: string (e.g., 'HGA001', 'HGE042')
 */
export const generateEmployeeId = (role: Role, allUsers: User[]): string => {
    let prefix = '';
    switch (role) {
        case Role.ADMIN: prefix = 'HGA'; break;
        case Role.EMPLOYEE: prefix = 'HGE'; break;
        case Role.INTERN: prefix = 'HGI'; break;
        case Role.HR: prefix = 'HGH'; break;
        case Role.VISITOR: prefix = 'HGV'; break;
        default: prefix = 'HG';
    }

    const relevantUsers = allUsers.filter(u => u.employeeId.startsWith(prefix));
    let maxId = 0;
    relevantUsers.forEach(u => {
        const numPart = parseInt(u.employeeId.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxId) {
            maxId = numPart;
        }
    });

    const nextIdNumber = maxId + 1;
    return `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
};

/**
 * Purpose: Provides a default empty structure for a new User object.
 */
export const emptyUser: Omit<User, 'id'> = {
    employeeId: '',
    name: '',
    email: '',
    department: '',
    phone: '',
    emergencyPhone: '',
    profilePhoto: '',
    role: Role.EMPLOYEE,
    password: '',
    status: UserStatus.ACTIVE,
    position: '',
    bloodGroup: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    aadharNumber: '',
    panNumber: '',
    aadharDocument: '',
    panDocument: '',
    bankDocument: '',
    otherDocument: '',
    companyName: '',
};
