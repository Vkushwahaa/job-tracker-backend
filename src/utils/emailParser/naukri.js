// utils/emailParser/naukri.js
import { extractFromHeader, capitalizeWords } from "./helpers.js";

export function parseNaukriEmail({
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

  const m1 = content.match(/for the position of\s+(.+?)\s+(?:at|with|in)/i);
  if (m1) jobTitle = m1[1].trim();

  const m2 = content.match(/at\s+([A-Z][A-Za-z0-9 &.\-]{2,80})/i);
  if (m2) companyName = m2[1].trim();

  if (!companyName) {
    const { display, domainCandidate } = extractFromHeader(htmlBody || subject);
    companyName =
      display || (domainCandidate ? capitalizeWords(domainCandidate) : null);
  }

  let score = 0;
  const reasons = [];
  if (companyName) {
    score += 50;
    reasons.push("Company from Naukri email");
  }
  if (jobTitle) {
    score += 40;
    reasons.push("Title from email");
  }
  score = Math.max(5, Math.min(100, score));

  return {
    source: "naukri",
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    inferredStatus: "applied",
    note: "Naukri heuristics",
    detection: { score, reasons },
  };
}
