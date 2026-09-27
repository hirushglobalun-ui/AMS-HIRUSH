import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
import * as tls from 'tls';

admin.initializeApp();
const db = admin.firestore();

const gmailUser = process.env.GMAIL_USER || '';
const gmailPass = process.env.GMAIL_APP_PASS || '';
const alertToEmail = process.env.ALERT_TO_EMAIL || gmailUser;

// Transporter configuration using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailUser, 
        pass: gmailPass 
    }
});

// Helper: Normalize URL to a clean hostname
export const getCleanHostname = (url: string): string => {
    if (!url) return '';
    let clean = url.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
    clean = clean.split('/')[0];
    clean = clean.split(':')[0];
    return clean;
};

// DNS Verification Check
export const checkDNS = async (hostname: string): Promise<boolean> => {
    if (!hostname) return false;
    try {
        await dns.promises.resolve(hostname);
        return true;
    } catch (err) {
        console.error(`DNS check failed for ${hostname}:`, err);
        return false;
    }
};

// SSL Certificate Auditing
interface SSLCheckResult {
    valid: boolean;
    daysRemaining?: number;
    error?: string;
}

export const checkSSL = (hostname: string): Promise<SSLCheckResult> => {
    return new Promise((resolve) => {
        if (!hostname) {
            resolve({ valid: false, error: 'Empty hostname' });
            return;
        }

        const socket = tls.connect({
            host: hostname,
            port: 443,
            servername: hostname,
            rejectUnauthorized: false // Allow inspection of invalid/expired certs
        }, () => {
            const cert = socket.getPeerCertificate();
            
            if (!cert || !Object.keys(cert).length) {
                resolve({ valid: false, error: 'No SSL certificate returned' });
                socket.end();
                return;
            }

            const validTo = new Date(cert.valid_to);
            const today = new Date();

            if (today > validTo) {
                resolve({ valid: false, error: `Certificate expired on ${cert.valid_to}` });
            } else {
                const diffTime = validTo.getTime() - today.getTime();
                const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                const authorized = socket.authorized;
                if (!authorized) {
                    resolve({ 
                        valid: false, 
                        daysRemaining, 
                        error: (socket.authorizationError ? socket.authorizationError.toString() : 'Untrusted, Self-signed, or Invalid Certificate Authority')
                    });
                } else {
                    resolve({ valid: true, daysRemaining });
                }
            }
            socket.end();
        });

        socket.on('error', (err) => {
            resolve({ valid: false, error: err.message });
        });

        socket.setTimeout(5000);
        socket.on('timeout', () => {
            resolve({ valid: false, error: 'Connection timeout' });
            socket.destroy();
        });
    });
};

// Scheduled Cron Job running daily at 05:00 / 5:00 AM IST (Asia/Kolkata timezone)
export const dailyExpiryCheck = onSchedule({
    schedule: '0 5 * * *',
    timeZone: 'Asia/Kolkata'
}, async (event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
    // const targetDateStr = twoDaysFromNow.toISOString().split('T')[0]; // YYYY-MM-DD

    const lastChecked = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    try {
        // 1. Fetch CRM Leads and Custom Domains
        const leadsSnap = await db.collection('leads').get();
        const customSnap = await db.collection('domains').get();

        const allRecords: { id: string; type: 'lead' | 'domain'; data: any }[] = [];
        leadsSnap.forEach(d => {
            const data = d.data();
            if (data.domainDetail && data.domainDetail.trim() !== '') {
                allRecords.push({ id: d.id, type: 'lead', data });
            }
        });
        customSnap.forEach(d => {
            allRecords.push({ id: d.id, type: 'domain', data: d.data() });
        });

        console.log(`Auditing ${allRecords.length} domains...`);

        for (const record of allRecords) {
            const { id, type, data } = record;

            const domainUrl = data.domainDetail || '';
            const cleanHostname = getCleanHostname(domainUrl);

            let dnsStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
            let sslStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
            let healthError = '';

            // Perform live DNS and SSL checks if hostname is present
            if (cleanHostname) {
                const dnsOk = await checkDNS(cleanHostname);
                if (!dnsOk) {
                    dnsStatus = 'Issue Detected';
                    sslStatus = 'Issue Detected';
                    healthError = 'DNS Resolution or Network Unreachable';
                } else {
                    const sslRes = await checkSSL(cleanHostname);
                    if (!sslRes.valid) {
                        sslStatus = 'Issue Detected';
                        healthError = sslRes.error || 'SSL Certificate Invalid or Expired';
                    }
                }
            } else {
                dnsStatus = 'Issue Detected';
                sslStatus = 'Issue Detected';
                healthError = 'Invalid or Empty Domain URL';
            }

            // Save fresh audit results to Firestore
            const updateFields = {
                dnsStatus,
                sslStatus,
                healthError,
                lastChecked
            };

            if (type === 'lead') {
                await db.collection('leads').doc(id).update(updateFields);
            } else {
                await db.collection('domains').doc(id).update(updateFields);
            }

            // --- TRIGGER AUTOMATED EMAIL ALERTS ---
            let isExpiringSoon = false;
            let daysRemaining = 9999;
            const issuesList: string[] = [];

            if (data.expiryDate) {
                const expiry = new Date(data.expiryDate);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 0) {
                    isExpiringSoon = true;
                    issuesList.push(`🚨 DOMAIN EXPIRED: Expired on ${data.expiryDate} (${Math.abs(daysRemaining)} days ago)`);
                } else if (daysRemaining <= 14) {
                    isExpiringSoon = true;
                    issuesList.push(`⏰ DOMAIN EXPIRING SOON: Expires in ${daysRemaining} day(s) (${data.expiryDate})`);
                }
            }

            if (dnsStatus === 'Issue Detected') {
                issuesList.push(`🌐 DNS RESOLUTION ISSUE: Unable to resolve ${cleanHostname || 'host'} (${healthError || 'DNS failure'})`);
            }
            if (sslStatus === 'Issue Detected' && dnsStatus === 'Healthy') {
                issuesList.push(`🔒 SSL CERTIFICATE ISSUE: ${healthError || 'SSL Certificate Error'}`);
            }

            const hasHealthIssue = dnsStatus === 'Issue Detected' || sslStatus === 'Issue Detected';

            if (isExpiringSoon || hasHealthIssue) {
                const alertReason = issuesList.join('<br>• ');
                
                let subjectType = '⚠️ Domain Health Alert';
                if (isExpiringSoon && hasHealthIssue) {
                    subjectType = '🚨 CRITICAL: Domain Expiry & DNS/SSL Issues';
                } else if (isExpiringSoon) {
                    subjectType = '⏰ DOMAIN EXPIRING SOON';
                } else if (dnsStatus === 'Issue Detected') {
                    subjectType = '🌐 DNS RESOLUTION ERROR';
                } else if (sslStatus === 'Issue Detected') {
                    subjectType = '🔒 SSL CERTIFICATE ERROR';
                }

                const emailSubject = `${subjectType} [5:00 AM Scheduled]: ${data.projectName || data.domainDetail}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; background-color: #ffffff;">
                        <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">🚨 Domain Health Alert Notice</h2>
                        <p style="color: #334155; font-size: 14px;">An automated health check at <strong>5:00 AM IST</strong> detected alert conditions for project: <strong>${data.projectName || 'Domain Record'}</strong>.</p>
                        
                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #cbd5e1;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Project Name:</strong></td><td style="font-weight: bold;">${data.projectName || 'N/A'}</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Domain URL:</strong></td><td style="color: #2563eb; font-weight: bold;">${data.domainDetail}</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Expiry Date:</strong></td><td style="color: #dc2626; font-weight: bold;">${data.expiryDate || 'N/A'} (${daysRemaining < 9000 ? `${daysRemaining} days remaining` : 'N/A'})</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>DNS Status:</strong></td><td style="color: ${dnsStatus === 'Issue Detected' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${dnsStatus}</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>SSL Status:</strong></td><td style="color: ${sslStatus === 'Issue Detected' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${sslStatus}</td></tr>
                                <tr><td style="padding: 8px 0; vertical-align: top;"><strong>Detected Issues:</strong></td><td style="color: #dc2626; font-weight: bold;">• ${alertReason}</td></tr>
                            </table>
                        </div>
                        
                        <p style="color: #64748b; font-size: 11px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center;">
                            Hirush Global AMS Automated Monitoring System • 5:00 AM IST Daily Email
                        </p>
                    </div>
                `;

                await transporter.sendMail({
                    from: `"Hirush AMS Monitor" <${gmailUser}>`,
                    to: alertToEmail,
                    subject: emailSubject,
                    html: emailHtml
                });
                console.log(`Automated email alert sent for ${data.projectName || data.domainDetail} to ${alertToEmail}`);
            }
        }
    } catch (error) {
        console.error("Error in domain health audit:", error);
    }
});
