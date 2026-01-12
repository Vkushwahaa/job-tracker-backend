// utils/emailParser/internshala.js
import { extractFromHeader, capitalizeWords } from "./helpers.js";

export function parseInternshalaEmail({
  subject = "",
  textBody = "",
  htmlBody = "",
}) {
  const content = `${subject} ${textBody || htmlBody || ""}`.replace(
    /\s+/g,
    " "
  );
  let jobTitle = null;
  let companyName = null;

  const titleMatch = content.match(/Application for\s+(.+?)\s+(?:at|with|in)/i);
  if (titleMatch) jobTitle = titleMatch[1].trim();

  const companyMatch = content.match(/at\s+([A-Z][A-Za-z0-9 &.\-]{2,80})/i);
  if (companyMatch) companyName = companyMatch[1].trim();

  if (!companyName) {
    const { display, domainCandidate } = extractFromHeader(htmlBody || subject);
    companyName =
      display || (domainCandidate ? capitalizeWords(domainCandidate) : null);
  }

  let score = 0;
  const reasons = [];
  if (companyName) {
    score += 50;
    reasons.push("Company inferred");
  }
  if (jobTitle) {
    score += 40;
    reasons.push("Title inferred");
  }
  score = Math.max(5, Math.min(100, score));

  return {
    source: "internshala",
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    inferredStatus: "applied",
    note: "Internshala heuristics",
    detection: { score, reasons },
  };
}
