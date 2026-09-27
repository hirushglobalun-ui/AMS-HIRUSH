/**
 * File: components/shared/DomainManager/domainUtils.ts
 * Purpose: Calculation, formatting, and external alert helpers for domain monitoring.
 * Author: Hirush Global AMS
 */

import { ConsolidatedDomain } from './types';
import { toast } from 'react-hot-toast';

export const calculateDaysRemaining = (expiryDate?: string): number => {
  if (!expiryDate) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = expiryDate.split('-').map(Number);
  const expiry = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const sendWhatsAppAlert = (domain: ConsolidatedDomain): void => {
  const phone = domain.pocPhone ? domain.pocPhone.replace(/\D/g, '') : '';
  const message = encodeURIComponent(
    `🚨 *Domain Alert for ${domain.projectName}*\n\n` +
    `• Domain: ${domain.domainDetail}\n` +
    `• Expiry Date: ${domain.expiryDate || 'N/A'}\n` +
    `• Days Remaining: ${domain.daysRemaining} days\n` +
    `• DNS Status: ${domain.dnsStatus || 'Healthy'}\n` +
    `• SSL Status: ${domain.sslStatus || 'Healthy'}\n` +
    (domain.healthError ? `• Issue: ${domain.healthError}\n` : '') +
    `\nPlease review or renew your domain settings as soon as possible.`
  );
  const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url, '_blank');
  toast.success(`WhatsApp alert window opened for ${domain.projectName}`);
};

export const auditDomainReachability = async (
  domainUrl: string
): Promise<{ dnsStatus: 'Healthy' | 'Issue Detected'; sslStatus: 'Healthy' | 'Issue Detected'; healthError: string }> => {
  const cleanUrl = domainUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  let dnsStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
  let sslStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
  let healthError = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    await fetch(`https://${cleanUrl}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      await fetch(`http://${cleanUrl}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      sslStatus = 'Issue Detected';
      healthError = 'SSL Certificate Error or HTTPS Unreachable';
    } catch {
      dnsStatus = 'Issue Detected';
      sslStatus = 'Issue Detected';
      healthError = 'DNS Resolution or Network Unreachable';
    }
  }

  return { dnsStatus, sslStatus, healthError };
};
