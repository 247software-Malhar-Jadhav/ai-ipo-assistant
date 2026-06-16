import "server-only";
import nodemailer from "nodemailer";
import { renderReminderEmail } from "@/lib/reminder-email";
import type { ReminderData } from "@/types/email";

/**
 * True only when both Gmail credentials are present, so callers can skip
 * sending (and avoid throwing) in environments without mail configured.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// Lazily-created, module-level transport singleton reused across calls.
let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        // Guaranteed present: callers gate on isEmailConfigured() first.
        user: process.env.GMAIL_USER ?? "",
        pass: process.env.GMAIL_APP_PASSWORD ?? "",
      },
    });
  }
  return transport;
}

/**
 * Render and send the daily IPO reminder email to a single recipient via
 * Gmail SMTP. Throws if email is not configured; send errors propagate.
 */
export async function sendReminderEmail(to: string, data: ReminderData): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured: set GMAIL_USER and GMAIL_APP_PASSWORD to send reminder emails.",
    );
  }

  const { subject, html, text } = renderReminderEmail(data);
  const fromName = process.env.MAIL_FROM_NAME || "AI IPO Assistant";

  await getTransport().sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
