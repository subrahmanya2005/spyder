import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import Goal from '@/models/Goal';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import { validateAmount } from '@/lib/validateAmount';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    const amtCheck = validateAmount(amount);
    if (!amtCheck.valid) return NextResponse.json({ error: 'INVALID_AMOUNT', message: amtCheck.error }, { status: 400 });

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const goals = await Goal.find({ user_id });

    let total_required_daily_saving = 0;
    if (goals.length > 0) {
      const total_saved = account.savings_wallet + account.cash_savings + account.investment_balance;
      for (const goal of goals) {
        const days_passed = Math.floor((new Date() - new Date(goal.created_at)) / (1000 * 60 * 60 * 24));
        const days_left = Math.max(1, goal.duration_days - days_passed);
        const remaining = Math.max(0, goal.target_amount - total_saved);
        total_required_daily_saving += remaining / days_left;
      }
    }

    let suggested_saving, mode, message;

    if (amount <= 500) {
      suggested_saving = amount * 0.05;
      mode = 'steadyMode';
      message = 'steadyMsg';
    } else if (amount <= 1500) {
      suggested_saving = amount * 0.15;
      mode = 'growthMode';
      message = 'growthMsg';
    } else {
      suggested_saving = amount * 0.25;
      mode = 'abundanceMode';
      message = 'abundanceMsg';
    }

    account.main_balance += amount;
    await account.save();

    await Transaction.create({ user_id, type: 'income', amount, source: 'external' });

    // ── ALL EMAILS ────────────────────────────────────────────────────────────
    const user = await User.findById(user_id).select('name email');
    const suggestion = Math.ceil(suggested_saving);
    const pct = Math.round((suggestion / amount) * 100);

    // ── EMAIL 1: Income logged (always fires) ─────────────────────────────────
    sendEmail({
      to: user.email,
      subject: "You earned today 💰 — don't forget to save!",
      html: `
        <!DOCTYPE html><html>
        <body style="margin:0;padding:0;background:#f3f4f6;
                     font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:16px;
                            border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="background:#10b981;padding:24px 32px;">
                    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                      💰 SaveMate
                    </h1>
                    <p style="margin:4px 0 0;color:#d1fae5;font-size:13px;">
                      Your smart savings companion
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">
                      Hey ${user.name} 👋
                    </h2>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 12px;">
                      You just logged
                      <strong style="color:#10b981;">
                        ₹${amount.toLocaleString('en-IN')}
                      </strong>
                      in income. Great work!
                    </p>
                    <div style="background:#ecfdf5;border:1.5px solid #6ee7b7;
                                border-radius:12px;padding:18px 20px;margin:0 0 20px;">
                      <p style="margin:0;font-size:15px;color:#065f46;">
                        💡 <strong>Smart suggestion:</strong> Save just
                        <span style="font-size:20px;font-weight:700;">
                          ₹${suggestion}
                        </span>
                        right now — that's only ${pct}% of what you earned.
                        You won't even notice it's gone!
                      </p>
                    </div>
                    <p style="color:#6b7280;font-size:14px;
                              line-height:1.6;margin:0 0 24px;">
                      Future you will absolutely thank you for this 😄
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                       style="display:inline-block;padding:14px 28px;
                              background:#10b981;color:#fff;border-radius:10px;
                              text-decoration:none;font-weight:600;font-size:15px;">
                      Save ₹${suggestion} now →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;
                             border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                      Building better saving habits, one day at a time 🌱
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `,
    });

    // ── EMAIL 2: Big income, low savings nudge ────────────────────────────────
    // Fires when: income > ₹1000 AND savings wallet is less than 10% of income
    const totalSaved = (account.savings_wallet || 0) + (account.cash_savings || 0);
    const savingsRatio = totalSaved / amount;

    if (amount >= 1000 && savingsRatio < 0.1) {
      sendEmail({
        to: user.email,
        subject: "Big day, small safety net 💸 — let's fix that",
        html: `
          <!DOCTYPE html><html>
          <body style="margin:0;padding:0;background:#f3f4f6;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
              <tr><td align="center">
                <table width="520" cellpadding="0" cellspacing="0"
                       style="background:#fff;border-radius:16px;
                              border:1px solid #e5e7eb;overflow:hidden;">
                  <tr>
                    <td style="background:#ef4444;padding:24px 32px;">
                      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                        💰 SaveMate
                      </h1>
                      <p style="margin:4px 0 0;color:#fecaca;font-size:13px;">
                        Your smart savings companion
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">
                        You earned big today, ${user.name} 💪
                      </h2>
                      <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 16px;">
                        You logged
                        <strong style="color:#10b981;">
                          ₹${amount.toLocaleString('en-IN')}
                        </strong>
                        — but your savings wallet is still low.
                        That's a gap worth closing right now.
                      </p>
                      <div style="background:#fff5f5;border:1.5px solid #fca5a5;
                                  border-radius:12px;padding:16px 20px;margin:0 0 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="text-align:center;padding:8px;">
                              <div style="font-size:13px;color:#6b7280;">
                                Earned today
                              </div>
                              <div style="font-size:20px;font-weight:700;color:#111827;">
                                ₹${amount.toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td style="text-align:center;padding:8px;
                                       border-left:1px solid #fca5a5;">
                              <div style="font-size:13px;color:#6b7280;">
                                Total saved
                              </div>
                              <div style="font-size:20px;font-weight:700;color:#ef4444;">
                                ₹${totalSaved.toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td style="text-align:center;padding:8px;
                                       border-left:1px solid #fca5a5;">
                              <div style="font-size:13px;color:#6b7280;">
                                Suggested save
                              </div>
                              <div style="font-size:20px;font-weight:700;color:#10b981;">
                                ₹${suggestion}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </div>
                      <p style="color:#6b7280;font-size:14px;
                                line-height:1.6;margin:0 0 24px;">
                        Good income with low savings is a risk.
                        Save <strong>₹${suggestion}</strong> today and
                        start building your safety net 🛡️
                      </p>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                         style="display:inline-block;padding:14px 28px;
                                background:#ef4444;color:#fff;border-radius:10px;
                                text-decoration:none;font-weight:600;font-size:15px;">
                        Save now →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f9fafb;
                               border-top:1px solid #e5e7eb;">
                      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                        Building better saving habits, one day at a time 🌱
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body></html>
        `,
      });
    }
    // ── END ALL EMAILS ────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      message: 'Income added',
      suggested_saving: suggestion,
      new_balance: account.main_balance,
      mode,
      mode_message: message,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}