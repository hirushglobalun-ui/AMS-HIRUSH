import dns from 'dns';
import tls from 'tls';
import nodemailer from 'nodemailer';

// Transporter configuration using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'hirushglobalun@gmail.com',
        pass: process.env.GMAIL_APP_PASS || 'qsrx ykqj qukr wrvv'
    }
});

// Helper: Normalize URL to a clean hostname
const getCleanHostname = (url) => {
    if (!url) return '';
    let clean = url.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
    clean = clean.split('/')[0];
    clean = clean.split(':')[0];
    return clean;
};

// Check DNS Resolution
const checkDNS = (hostname) => {
    return new Promise((resolve) => {
        if (!hostname) return resolve(false);
        dns.resolve(hostname, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

// Check SSL Certificate Health
const checkSSL = (hostname) => {
    return new Promise((resolve) => {
        if (!hostname) return resolve({ valid: false, error: 'Empty hostname' });

        const socket = tls.connect({
            host: hostname,
            port: 443,
            servername: hostname,
            rejectUnauthorized: false
        }, () => {
            const cert = socket.getPeerCertificate();
            if (!cert || !Object.keys(cert).length) {
                socket.end();
                return resolve({ valid: false, error: 'No SSL Certificate returned' });
            }

            const validTo = new Date(cert.valid_to);
            const today = new Date();

            if (today > validTo) {
                socket.end();
                return resolve({ valid: false, error: `Certificate expired on ${cert.valid_to}` });
            } else {
                const authorized = socket.authorized;
                socket.end();
                if (!authorized) {
                    return resolve({ valid: false, error: socket.authorizationError || 'Untrusted Certificate' });
                }
                return resolve({ valid: true });
            }
        });

        socket.on('error', (err) => {
            resolve({ valid: false, error: err.message });
        });

        socket.setTimeout(6000, () => {
            socket.destroy();
            resolve({ valid: false, error: 'Connection timeout' });
        });
    });
};

// Helper: Parse Firestore REST JSON values
const parseFirestoreFields = (fields) => {
    if (!fields) return {};
    const result = {};
    for (const key of Object.keys(fields)) {
        const val = fields[key];
        if (val.stringValue !== undefined) result[key] = val.stringValue;
        else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue, 10);
        else if (val.doubleValue !== undefined) result[key] = parseFloat(val.doubleValue);
        else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
        else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    }
    return result;
};

// Get anonymous Auth token for authenticated Firestore queries
const getAuthToken = async () => {
    const apiKey = "AIzaSyAAsB5Q363MdGO1YkolcpStz1o6CxgcTdU";
    try {
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ returnSecureToken: true })
        });
        if (res.ok) {
            const json = await res.json();
            return json.idToken;
        }
    } catch (err) {
        console.warn('Anonymous auth warning:', err.message);
    }
    return null;
};

// Fetch collection documents via Firestore REST API
const fetchCollection = async (collectionName, idToken) => {
    const apiKey = "AIzaSyAAsB5Q363MdGO1YkolcpStz1o6CxgcTdU";
    const url = `https://firestore.googleapis.com/v1/projects/hirushglobal-llp/databases/(default)/documents/${collectionName}?key=${apiKey}`;
    const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${collectionName}: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.documents) return [];

    return json.documents.map(doc => {
        const docId = doc.name.split('/').pop();
        return { id: docId, ...parseFirestoreFields(doc.fields) };
    });
};

const runDailyAudit = async () => {
    console.log('🚀 Starting Automated Domain Health Audit...');

    try {
        const idToken = await getAuthToken();
        const [leads, customDomains] = await Promise.all([
            fetchCollection('leads', idToken),
            fetchCollection('domains', idToken)
        ]);

        const allRecords = [];
        leads.forEach(d => {
            if (d.domainDetail && d.domainDetail.trim() !== '') {
                const status = (d.status || '').toLowerCase();
                // Skip disposed, lost, or archived leads
                if (status === 'disposed' || status === 'lost' || status === 'archived' || status === 'junk') {
                    return;
                }
                allRecords.push({ id: d.id, type: 'lead', data: d });
            }
        });
        customDomains.forEach(d => {
            const status = (d.status || '').toLowerCase();
            // Skip inactive or archived custom domains
            if (status === 'inactive' || status === 'archived') {
                return;
            }
            allRecords.push({ id: d.id, type: 'domain', data: d });
        });

        console.log(`Auditing ${allRecords.length} registered domain records...`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const record of allRecords) {
            const { data } = record;
            const cleanUrl = getCleanHostname(data.domainDetail || '');
            if (!cleanUrl) continue;

            // Check if domain expired more than 30 days ago
            let isExpiringSoon = false;
            let daysRemaining = 9999;
            const issuesList = [];

            if (data.expiryDate) {
                const expiry = new Date(data.expiryDate);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

                // If expired for more than 30 days, do not continue spamming daily alerts
                if (daysRemaining < -30) {
                    console.log(`⏩ Skipping ${data.projectName || cleanUrl}: Expired ${Math.abs(daysRemaining)} days ago (>30 days threshold).`);
                    continue;
                } else if (daysRemaining <= 0) {
                    isExpiringSoon = true;
                    issuesList.push(`🚨 DOMAIN EXPIRED: Expired on ${data.expiryDate} (${Math.abs(daysRemaining)} days ago)`);
                } else if (daysRemaining <= 14) {
                    isExpiringSoon = true;
                    issuesList.push(`⏰ DOMAIN EXPIRING SOON: Expires in ${daysRemaining} day(s) (${data.expiryDate})`);
                }
            }

            console.log(`🔍 Auditing domain: ${data.projectName || cleanUrl} (${cleanUrl})...`);

            const dnsOk = await checkDNS(cleanUrl);
            const sslRes = await checkSSL(cleanUrl);

            const dnsStatus = dnsOk ? 'Healthy' : 'Issue Detected';
            const sslStatus = sslRes.valid ? 'Healthy' : 'Issue Detected';
            const healthError = !dnsOk 
                ? 'DNS Resolution or Network Unreachable' 
                : (!sslRes.valid ? (sslRes.error || 'SSL Certificate Error') : '');

            if (dnsStatus === 'Issue Detected') {
                issuesList.push(`🌐 DNS RESOLUTION ISSUE: Unable to resolve host or server unreachable (${healthError})`);
            }
            if (sslStatus === 'Issue Detected' && dnsStatus === 'Healthy') {
                issuesList.push(`🔒 SSL CERTIFICATE ISSUE: ${healthError}`);
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

                const emailSubject = `${subjectType}: ${data.projectName || cleanUrl}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; background-color: #ffffff;">
                        <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">🚨 Domain Health Alert Notice</h2>
                        <p style="color: #334155; font-size: 14px;">An automated health check detected alert conditions for project: <strong>${data.projectName || cleanUrl}</strong>.</p>
                        
                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #cbd5e1;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Project Name:</strong></td><td style="font-weight: bold;">${data.projectName || 'N/A'}</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Domain URL:</strong></td><td style="color: #2563eb; font-weight: bold;">${data.domainDetail}</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Expiry Date:</strong></td><td style="color: #dc2626; font-weight: bold;">${data.expiryDate || 'N/A'} (${daysRemaining < 9000 ? `${daysRemaining} days left` : 'N/A'})</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>DNS Status:</strong></td><td style="color: ${dnsStatus === 'Issue Detected' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${dnsStatus}</td></tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>SSL Status:</strong></td><td style="color: ${sslStatus === 'Issue Detected' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${sslStatus}</td></tr>
                                <tr><td style="padding: 8px 0; vertical-align: top;"><strong>Detected Issues:</strong></td><td style="color: #dc2626; font-weight: bold;">• ${alertReason}</td></tr>
                            </table>
                        </div>
                        
                        <p style="color: #64748b; font-size: 11px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center;">
                            Hirush Global AMS Automated Monitoring System • Daily Email Alert
                        </p>
                    </div>
                `;

                try {
                    await transporter.sendMail({
                        from: '"Hirush AMS Monitor" <hirushglobalun@gmail.com>',
                        to: 'hirushglobalun@gmail.com',
                        subject: emailSubject,
                        html: emailHtml
                    });
                    console.log(`✅ Email alert dispatched for ${data.projectName || cleanUrl} to hirushglobalun@gmail.com`);
                } catch (mailErr) {
                    console.error(`❌ Failed to send email for ${data.projectName || cleanUrl}:`, mailErr);
                }
            } else {
                console.log(`✅ ${data.projectName || cleanUrl} is Healthy. No email needed.`);
            }
        }
        console.log('🎉 Audit execution finished successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Audit execution error:', err);
        process.exit(1);
    }
};

runDailyAudit();
