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

    const emailSubject = `📢 [Hirush Global] ${title}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                
                <!-- HEADER BRANDING -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: left; border-bottom: 3px solid #2563eb;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; margin-bottom: 6px;">
                            HIRUSH GLOBAL LLP
                          </div>
                          <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            Attendance & Enterprise Management System
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- BADGE & TITLE -->
                <tr>
                  <td style="padding: 28px 28px 16px 28px;">
                    <div style="display: inline-block; padding: 4px 12px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      📢 New Company Notice
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      ${title}
                    </h1>
                  </td>
                </tr>

                <!-- METADATA CARD -->
                <tr>
                  <td style="padding: 0 28px 20px 28px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 12px 16px;">
                      <tr>
                        <td style="font-size: 12px; color: #64748b; padding: 4px 0;">
                          <strong style="color: #334155;">From:</strong> ${cleanSenderName} ${cleanSenderRole}
                        </td>
                        <td align="right" style="font-size: 12px; color: #64748b; padding: 4px 0;">
                          <strong style="color: #334155;">Audience:</strong> ${audienceText}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- MESSAGE BODY -->
                <tr>
                  <td style="padding: 0 28px 24px 28px;">
                    <div style="background-color: #ffffff; border-left: 4px solid #2563eb; padding: 18px 20px; border-radius: 0 8px 8px 0; background-color: #f8fafc; font-size: 15px; line-height: 1.6; color: #1e293b;">
                      ${sanitizedContent}
                    </div>
                    ${imageHtml}
                  </td>
                </tr>

                <!-- CALL TO ACTION BUTTON -->
                <tr>
                  <td align="center" style="padding: 8px 28px 32px 28px;">
                    <a href="${appUrl}/messages" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                      Open in AMS Portal →
                    </a>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 28px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 500;">
                      Hirush Global LLP • Automated Enterprise Communication System
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
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
