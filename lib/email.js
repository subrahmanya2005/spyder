import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
                     from: 'SaveMate <no-reply@riverqueen.in>',

      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email failed:", err);
    // never crashes your app
  }
}