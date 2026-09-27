import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectName,
      domainDetail,
      expiryDate,
      dnsStatus,
      sslStatus,
      healthError,
      alertReason,
      toEmail
    } = body;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASS;
    const recipient = toEmail || process.env.ALERT_TO_EMAIL || gmailUser;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        { error: 'Gmail credentials not configured in environment variables (GMAIL_USER, GMAIL_APP_PASS)' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    const isIssue = dnsStatus === 'Issue Detected' || sslStatus === 'Issue Detected';
    const emailSubject = `⚠️ Domain Health Notice: ${projectName || domainDetail} [${isIssue ? 'ACTION REQUIRED' : 'TEST ALERT'}]`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; background-color: #ffffff;">
        <h2 style="color: ${isIssue ? '#dc2626' : '#2563eb'}; margin-top: 0; font-size: 20px;">
          ${isIssue ? '🚨 Domain Alert Notice' : '📧 Domain Health Verification Notice'}
        </h2>
        <p style="color: #334155; font-size: 14px;">
          A domain status notification was triggered from Hirush Global AMS for project: <strong>${projectName || 'Unnamed Project'}</strong>.
        </p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #cbd5e1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; width: 140px;"><strong>Project Name:</strong></td><td style="font-weight: bold;">${projectName || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Domain URL:</strong></td><td style="color: #2563eb; font-weight: bold;">${domainDetail || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Expiry Date:</strong></td><td style="color: #dc2626; font-weight: bold;">${expiryDate || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>DNS Status:</strong></td><td style="color: ${dnsStatus === 'Issue Detected' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${dnsStatus || 'Healthy'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>SSL Status:</strong></td><td style="color: ${sslStatus === 'Issue Detected' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${sslStatus || 'Healthy'}</td></tr>
            ${healthError ? `<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;"><strong>Health Detail:</strong></td><td style="color: #dc2626;">${healthError}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; vertical-align: top;"><strong>Trigger Reason:</strong></td><td style="color: #475569;">${alertReason || 'Manual alert dispatched via Nodemailer'}</td></tr>
          </table>
        </div>
        
        <p style="color: #64748b; font-size: 11px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center;">
          Hirush Global AMS • Automated Notifications • Powered by Nodemailer
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Hirush AMS Monitor" <${gmailUser}>`,
      to: recipient,
      subject: emailSubject,
      html: emailHtml
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      recipient
    });
  } catch (error: any) {
    console.error('Error sending domain alert via Nodemailer:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
