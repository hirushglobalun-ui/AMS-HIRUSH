import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      senderName,
      senderRole,
      recipientType,
      targetLabel,
      recipients,
      imageUrl,
      portalUrl
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Message title is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASS;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        { error: 'Email service credentials not configured in server environment' },
        { status: 500 }
      );
    }

    // Validate and sanitize recipient emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawRecipients: string[] = Array.isArray(recipients) ? recipients : [];
    const validEmails = Array.from(
      new Set(
        rawRecipients
          .filter((email): email is string => typeof email === 'string' && emailRegex.test(email.trim()))
          .map((email) => email.trim().toLowerCase())
      )
    );

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipient email addresses provided' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    const appUrl = portalUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://ams.hirushglobal.com';
    const cleanSenderName = senderName || 'Hirush Global Management';
    const cleanSenderRole = senderRole ? `(${senderRole})` : '';
    const audienceText = targetLabel || (recipientType === 'all' ? 'All Employees' : 'Designated Team');

    // Convert newlines in content to HTML breaks safely
    const sanitizedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');

    const imageHtml = imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')
      ? `<div style="margin: 20px 0; text-align: center;">
          <img src="${imageUrl}" alt="Announcement Attachment" style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
        </div>`
      : '';

    // High-performance lightweight CDN logo URL (optimized to 200x200, 3.9KB for Google Image Proxy & email clients)
    const companyLogoUrl =
      process.env.COMPANY_LOGO_URL ||
      'https://res.cloudinary.com/hflmixsy/image/upload/w_200,h_200,c_fit,f_png/v1790566928/hirush_ams/hirush_company_logo.png';

    const emailSubject = `📢 [Hirush Global] ${title}`;
    const sentDateFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                
                <!-- TOP BRAND GRADIENT ACCENT -->
                <tr>
                  <td style="height: 5px; background: linear-gradient(90deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%);"></td>
                </tr>

                <!-- AMS THEMED HEADER WITH LOGO -->
                <tr>
                  <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="54" valign="middle">
                          <div style="width: 48px; height: 48px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); text-align: center;">
                            <img src="${companyLogoUrl}" alt="Hirush Global" width="42" height="42" style="display: block; width: 42px; height: 42px; max-width: 42px; max-height: 42px; object-fit: contain; margin: 0 auto; border: 0;" />
                          </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                          <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; line-height: 1.2;">
                            Hirush Global
                          </div>
                          <div style="font-size: 12px; font-weight: 600; color: #6366f1; letter-spacing: 0.2px; margin-top: 2px;">
                            Attendance & Enterprise Management System
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <div style="display: inline-block; background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px;">
                            Notice
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- TITLE & BADGE -->
                <tr>
                  <td style="padding: 28px 32px 12px 32px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.35; letter-spacing: -0.3px;">
                      ${title}
                    </h1>
                  </td>
                </tr>

                <!-- METADATA CARD (AMS THEME) -->
                <tr>
                  <td style="padding: 0 32px 20px 32px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 12px 18px;">
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 3px 0;">
                          <strong style="color: #1e293b;">From:</strong> ${cleanSenderName} <span style="color: #6366f1; font-weight: 600;">${cleanSenderRole}</span>
                        </td>
                        <td align="right" style="font-size: 13px; color: #64748b; padding: 3px 0;">
                          <strong style="color: #1e293b;">Date:</strong> ${sentDateFormatted}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="font-size: 13px; color: #64748b; padding-top: 4px; border-top: 1px dashed #e2e8f0; margin-top: 4px;">
                          <strong style="color: #1e293b;">Audience:</strong> <span style="background-color: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">${audienceText}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- MESSAGE BODY (AMS THEME) -->
                <tr>
                  <td style="padding: 0 32px 24px 32px;">
                    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 0 12px 12px 0; padding: 20px 22px; font-size: 15px; line-height: 1.65; color: #334155; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                      ${sanitizedContent}
                    </div>
                    ${imageHtml}
                  </td>
                </tr>

                <!-- CALL TO ACTION (AMS PRIMARY BUTTON) -->
                <tr>
                  <td align="center" style="padding: 8px 32px 32px 32px;">
                    <a href="${appUrl}/messages" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); letter-spacing: 0.2px;">
                      Open in AMS Portal →
                    </a>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569; font-weight: 600;">
                      Hirush Global LLP • Automated Enterprise Communication System
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.45;">
                      This notification was transmitted securely to verified company employees. Please do not reply directly to this automated email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send using BCC to protect employee email privacy
    await transporter.sendMail({
      from: `"Hirush Global AMS" <${gmailUser}>`,
      to: gmailUser, // Primary sender receives copy
      bcc: validEmails, // All employees receive blind copy
      subject: emailSubject,
      html: emailHtml
    });

    return NextResponse.json({
      success: true,
      deliveredCount: validEmails.length,
      message: `Announcement email successfully dispatched to ${validEmails.length} recipient(s)`
    });
  } catch (error: any) {
    console.error('Error sending message announcement email:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch announcement email', details: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
