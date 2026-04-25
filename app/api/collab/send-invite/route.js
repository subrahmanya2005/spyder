import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSessionUser } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipientEmail, goalName, inviterName, inviteLink } = await req.json();

    if (!recipientEmail || !inviteLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    await resend.emails.send({
             from: 'SaveMate <no-reply@riverqueen.in>',

      to: recipientEmail,
      subject: `🎯 ${inviterName} invited you to a savings goal on SaveMate!`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0B0B0B; border-radius: 24px; overflow: hidden; border: 1px solid rgba(30,215,96,0.2);">
          <div style="background: linear-gradient(135deg, #0D0D0D 0%, #111 100%); padding: 40px; text-align: center; border-bottom: 1px solid rgba(30,215,96,0.1);">
            <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 44px; height: 44px; background: #000; border: 1px solid rgba(30,215,96,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #1ED760; font-size: 22px;">🐷</span>
              </div>
              <span style="color: #1ED760; font-size: 24px; font-weight: 900; letter-spacing: -1px;">SAVEMATE</span>
            </div>
            <p style="color: #555; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0;">Smart Savings · Family Goals</p>
          </div>

          <div style="padding: 40px;">
            <h1 style="color: #fff; font-size: 28px; font-weight: 900; margin: 0 0 8px; letter-spacing: -1px;">You're invited! 🎯</h1>
            <p style="color: #888; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">
              <strong style="color: #fff">${inviterName}</strong> wants to collaborate with you on a savings goal.
            </p>

            <div style="background: #121212; border: 1px solid rgba(30,215,96,0.2); border-radius: 20px; padding: 24px; margin-bottom: 28px;">
              <p style="color: #555; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px;">Goal Name</p>
              <p style="color: #1ED760; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">${goalName}</p>
            </div>

            <a href="${inviteLink}" 
               style="display: block; background: #1ED760; color: #000; text-decoration: none; font-weight: 900; font-size: 16px; text-align: center; padding: 18px 32px; border-radius: 16px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(30,215,96,0.3);">
              Accept Invitation →
            </a>

            <p style="color: #444; font-size: 12px; text-align: center; margin: 0;">
              Or copy this link: <span style="color: #1ED760; word-break: break-all;">${inviteLink}</span>
            </p>
          </div>

          <div style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <p style="color: #333; font-size: 11px; margin: 0;">© SaveMate · savemet1234@gmail.com · +91 63636 28385</p>
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'Invite email sent!' });
  } catch (error) {
    console.error('Send invite email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
