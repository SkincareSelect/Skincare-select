import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in your environment."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transport = getTransport();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

  return transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/**
 * Sends mail to many recipients one at a time so a single bad address
 * doesn't stop delivery to everyone else. Returns per-recipient results.
 */
export async function sendBulkMail(
  recipients: string[],
  build: (email: string) => { subject: string; html: string; text?: string }
) {
  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const email of recipients) {
    try {
      const { subject, html, text } = build(email);
      await sendMail({ to: email, subject, html, text });
      results.push({ email, ok: true });
    } catch (error) {
      results.push({
        email,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
