import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      employeeName,
      employeeId,
      employeeEmail,
      employeeDepartment,
      leaveType,
      duration,
      halfDayType,
      startDate,
      endDate,
      reason,
      recipientEmails,
      portalUrl,
    } = body;

    if (!employeeName || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required leave application fields' },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASS;

    if (!gmailUser || !gmailPass) {
      console.warn('Gmail credentials not configured in server environment');
      return NextResponse.json(
        { error: 'Email service credentials not configured in server environment' },
        { status: 500 }
      );
    }

    // Filter and sanitize the actual Admin & HR emails passed from the database (No preset emails)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawRecipients: string[] = Array.isArray(recipientEmails) ? recipientEmails : [];
    const validRecipients = Array.from(
      new Set(
        rawRecipients
          .filter((email): email is string => typeof email === 'string' && emailRegex.test(email.trim()))
          .map((email) => email.trim().toLowerCase())
      )
    );

    if (validRecipients.length === 0) {
      console.warn('No registered Admin or HR email addresses provided');
      return NextResponse.json(
        { error: 'No registered Admin or HR email addresses found' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const appUrl = portalUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://ams.hirushglobal.com';

    // High-performance lightweight CDN logo URL (optimized to 200x200, 3.9KB for Google Image Proxy & email clients)
    const companyLogoUrl =
      process.env.COMPANY_LOGO_URL ||
      'https://res.cloudinary.com/hflmixsy/image/upload/w_200,h_200,c_fit,f_png/v1790566928/hirush_ams/hirush_company_logo.png';

    // Format display dates
    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const dateRangeStr =
      startDate === endDate
        ? formattedStartDate
        : `${formattedStartDate} — ${formattedEndDate}`;

    // Color theme based on leave type
    let badgeBg = '#e0e7ff';
    let badgeText = '#4338ca';
    if (leaveType === 'Sick') {
      badgeBg = '#fee2e2';
      badgeText = '#b91c1c';
    } else if (leaveType === 'Unpaid') {
      badgeBg = '#fef3c7';
      badgeText = '#b45309';
    } else if (leaveType === 'WFH') {
      badgeBg = '#dcfce7';
      badgeText = '#15803d';
    }

    const sanitizedReason = (reason || 'No reason provided')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');

    const durationLabel =
      duration === 'Half Day'
        ? `Half Day (${halfDayType || 'First Half'})`
        : 'Full Day';

    const emailSubject = `🗓️ [Leave Request] ${employeeName} - ${leaveType} Leave (${dateRangeStr})`;

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
                  <td style="height: 5px; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);"></td>
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
                            Management & Human Resources
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <div style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">
                            Pending Review
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- TITLE -->
                <tr>
                  <td style="padding: 28px 32px 12px 32px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.35; letter-spacing: -0.3px;">
                      New Leave Application Received
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b;">
                      An employee has submitted a leave request that requires your review and approval.
                    </p>
                  </td>
                </tr>

                <!-- EMPLOYEE DETAILS CARD -->
                <tr>
                  <td style="padding: 12px 32px 16px 32px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px;">
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 4px 0;">
                          <strong style="color: #1e293b;">Employee:</strong> ${employeeName}
                        </td>
                        <td align="right" style="font-size: 13px; color: #64748b; padding: 4px 0;">
                          <strong style="color: #1e293b;">Employee ID:</strong> <span style="font-family: monospace; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${employeeId || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 4px 0;">
                          <strong style="color: #1e293b;">Department:</strong> ${employeeDepartment || 'General'}
                        </td>
                        <td align="right" style="font-size: 13px; color: #64748b; padding: 4px 0;">
                          <strong style="color: #1e293b;">Email:</strong> ${employeeEmail || 'N/A'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- LEAVE DETAILS CARD -->
                <tr>
                  <td style="padding: 0 32px 20px 32px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px;">
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 6px 0;">
                          <strong style="color: #1e293b;">Leave Type:</strong>
                          <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeText}; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-left: 6px;">
                            ${leaveType}
                          </span>
                        </td>
                        <td align="right" style="font-size: 13px; color: #64748b; padding: 6px 0;">
                          <strong style="color: #1e293b;">Duration:</strong> ${durationLabel}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="font-size: 13px; color: #64748b; padding: 8px 0 4px 0; border-top: 1px dashed #e2e8f0; margin-top: 6px;">
                          <strong style="color: #1e293b;">Dates:</strong> <span style="color: #0f172a; font-weight: 600;">${dateRangeStr}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 8px;">
                          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">
                            Reason:
                          </div>
                          <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 14px; line-height: 1.55; color: #334155; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                            ${sanitizedReason}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CALL TO ACTION (PORTAL BUTTON) -->
                <tr>
                  <td align="center" style="padding: 8px 32px 32px 32px;">
                    <a href="${appUrl}/leave" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); letter-spacing: 0.2px;">
                      Review & Approve in AMS Portal →
                    </a>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569; font-weight: 600;">
                      Hirush Global LLP • Automated Management & Human Resources Notification
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.45;">
                      This notification was transmitted securely to registered Admin & HR personnel. Please log in to the AMS Portal to review this request.
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

    await transporter.sendMail({
      from: `"Hirush Global Leave Alert" <${gmailUser}>`,
      to: validRecipients,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      deliveredTo: validRecipients,
      message: `Leave notification dispatched to ${validRecipients.join(', ')}`,
    });
  } catch (error: any) {
    console.error('Error dispatching leave notification email:', error);
    return NextResponse.json(
      {
        error: 'Failed to dispatch leave notification email',
        details: error?.message || 'Internal error',
      },
      { status: 500 }
    );
  }
}
