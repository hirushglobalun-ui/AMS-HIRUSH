/**
 * @file utils.ts
 * @description Provides logic and utilities for utils.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import { LeaveRequest } from '../../../types';

export const formatApplyDate = (createdAt: any) => {
    if (!createdAt) return 'N/A';
    if (typeof createdAt.toDate === 'function') {
        const d = createdAt.toDate();
        return d.toISOString().split('T')[0];
    }
    if (createdAt.seconds) {
        const d = new Date(createdAt.seconds * 1000);
        return d.toISOString().split('T')[0];
    }
    try {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    } catch (_e) {
        /* ignore invalid date string */
    }
    return 'N/A';
};

export const getLeaveDays = (req: LeaveRequest) => {
    if (req.duration === 'Half Day') return 0.5;
    if (!req.startDate || !req.endDate) return 0;
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
};
