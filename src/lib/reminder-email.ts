import type { AiLabel } from "@prisma/client";
import type { ReminderData, ReminderIpo } from "@/types/email";

/**
 * Readable text + accent color for each AI conviction label, plus the
 * fallback used while a ranking is still being computed (null label).
 */
const LABEL_META: Record<AiLabel, { text: string; color: string }> = {
  high_conviction: { text: "High conviction", color: "#059669" },
  good: { text: "Good", color: "#16a34a" },
  neutral: { text: "Neutral", color: "#6b7280" },
  avoid: { text: "Avoid", color: "#dc2626" },
};

const LABEL_FALLBACK = { text: "Ranking…", color: "#6b7280" };

function labelMeta(label: AiLabel | null): { text: string; color: string } {
  return label ? LABEL_META[label] : LABEL_FALLBACK;
}

/** Format an implied listing gain percentage with an explicit sign. */
function formatPremium(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

// Shared inline-style fragments to keep the HTML markup readable.
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const ACCENT = "#4f46e5";

/** Render one IPO card as a bordered table block for the HTML email. */
function renderIpoCard(ipo: ReminderIpo, opts: { showApplied: boolean }): string {
  const meta = labelMeta(ipo.label);
  const appliedTag = opts.showApplied
    ? ipo.applied
      ? `<span style="color:#059669;font-weight:600;">Applied ✓</span>`
      : `<span style="color:#6b7280;">Not applied</span>`
    : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;border:1px solid #e5e7eb;border-left:4px solid ${meta.color};border-radius:8px;">
      <tr>
        <td style="padding:14px 16px;font-family:${FONT_STACK};">
          <div style="font-size:16px;font-weight:600;line-height:1.3;color:#111827;">
            <a href="${ipo.url}" style="color:${ACCENT};text-decoration:none;">${ipo.name}</a>
            <span style="color:#6b7280;font-weight:400;">(${ipo.symbol})</span>
          </div>
          <div style="margin-top:4px;font-size:13px;color:#6b7280;">
            ${ipo.exchange} · ${ipo.priceBand} · Closes ${ipo.closeDate}
          </div>
          <div style="margin-top:8px;font-size:14px;color:#374151;">
            GMP ₹${ipo.gmp} (${formatPremium(ipo.premiumPct)})
            &nbsp;·&nbsp; AI score ${ipo.score}/10
            &nbsp;·&nbsp; <span style="color:${meta.color};font-weight:600;">${meta.text}</span>
          </div>
          ${appliedTag ? `<div style="margin-top:6px;font-size:13px;">${appliedTag}</div>` : ""}
        </td>
      </tr>
    </table>`;
}

/** Render a titled section wrapping a list of IPO cards. */
function renderSection(
  title: string,
  ipos: ReminderIpo[],
  opts: { showApplied: boolean; note?: string },
): string {
  if (ipos.length === 0) return "";
  const note = opts.note
    ? `<p style="margin:0 0 10px 0;font-size:13px;color:#6b7280;font-family:${FONT_STACK};">${opts.note}</p>`
    : "";
  return `
    <tr>
      <td style="padding:20px 24px 0 24px;">
        <h2 style="margin:0 0 12px 0;font-size:17px;font-weight:700;color:#111827;font-family:${FONT_STACK};">${title}</h2>
        ${note}
        ${ipos.map((ipo) => renderIpoCard(ipo, { showApplied: opts.showApplied })).join("")}
      </td>
    </tr>`;
}

/** Render one IPO as a plain-text line for the text/plain alternative. */
function textLine(ipo: ReminderIpo, opts: { showApplied: boolean }): string {
  const meta = labelMeta(ipo.label);
  const base = `- ${ipo.name} (${ipo.symbol}) · ${ipo.exchange} · ${ipo.priceBand}
    GMP ₹${ipo.gmp} (${formatPremium(ipo.premiumPct)}) · AI score ${ipo.score}/10 · ${meta.text}
    ${ipo.url}`;
  if (!opts.showApplied) return base;
  return `${base}
    ${ipo.applied ? "Applied" : "Not applied"}`;
}

/** Build a titled plain-text section, or "" when there are no items. */
function textSection(
  title: string,
  ipos: ReminderIpo[],
  opts: { showApplied: boolean; note?: string },
): string {
  if (ipos.length === 0) return "";
  const note = opts.note ? `${opts.note}\n` : "";
  return `\n${title}\n${note}${ipos
    .map((ipo) => textLine(ipo, { showApplied: opts.showApplied }))
    .join("\n")}\n`;
}

/**
 * Render the daily IPO reminder email. Pure function: takes a fully-prepared
 * ReminderData payload and returns the subject plus HTML and plain-text bodies
 * for use as a multipart/alternative message.
 */
export function renderReminderEmail(data: ReminderData): {
  subject: string;
  html: string;
  text: string;
} {
  const hasAnything = data.live.length > 0 || data.upcoming.length > 0;
  const subject = hasAnything
    ? `📈 IPO morning brief — ${data.live.length} live, ${data.bestToApply.length} to apply`
    : "📈 IPO morning brief — nothing open right now";

  const summary = `Here's your IPO brief. You've applied to ${data.appliedCount} open IPO(s).`;
  const applyNote = "These top picks are not yet applied to — review and act before they close.";

  // --- HTML body ---
  const sections = [
    renderSection("✅ Apply today", data.bestToApply, {
      showApplied: false,
      note: applyNote,
    }),
    renderSection("🟢 Live now", data.live, { showApplied: true }),
    renderSection("🗓 Opening soon", data.upcoming, { showApplied: false }),
  ].join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>IPO morning brief</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <!-- Header -->
            <tr>
              <td style="background-color:${ACCENT};padding:24px;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;font-family:${FONT_STACK};">AI IPO Assistant</div>
                <div style="margin-top:4px;font-size:13px;color:#e0e7ff;font-family:${FONT_STACK};">${data.dateLabel}</div>
              </td>
            </tr>
            <!-- Greeting -->
            <tr>
              <td style="padding:24px 24px 0 24px;font-family:${FONT_STACK};">
                <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">Hi ${data.userName},</p>
                <p style="margin:8px 0 0 0;font-size:14px;color:#374151;line-height:1.5;">${summary}</p>
              </td>
            </tr>
            ${sections}
            <!-- CTA button -->
            <tr>
              <td style="padding:24px;" align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius:8px;background-color:${ACCENT};">
                      <a href="${data.appUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${FONT_STACK};">Open dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 24px;border-top:1px solid #e5e7eb;font-family:${FONT_STACK};">
                <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">For research only · not investment advice</p>
                <p style="margin:6px 0 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">This is an automated daily reminder from AI IPO Assistant.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // --- Plain-text body ---
  const textBody = [
    `AI IPO Assistant — ${data.dateLabel}`,
    "",
    `Hi ${data.userName},`,
    summary,
    textSection("✅ Apply today", data.bestToApply, {
      showApplied: false,
      note: applyNote,
    }),
    textSection("🟢 Live now", data.live, { showApplied: true }),
    textSection("🗓 Opening soon", data.upcoming, { showApplied: false }),
    "",
    `Open dashboard: ${data.appUrl}`,
    "",
    "For research only · not investment advice",
    "This is an automated daily reminder from AI IPO Assistant.",
  ].join("\n");

  return { subject, html, text: textBody };
}
