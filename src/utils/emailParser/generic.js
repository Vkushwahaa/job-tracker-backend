// utils/emailParser/generic.js
import { extractFromHeader, capitalizeWords } from "./helpers.js";

export function parseGenericEmail({ subject = "", textBody = "", htmlBody }) {
  const plain = `${subject || ""} ${textBody || ""}`
    .replace(/\s+/g, " ")
    .trim();
  const lc = plain.toLowerCase();

  let inferredStatus = null;
  if (lc.includes("interview")) inferredStatus = "interview";
  else if (
    lc.includes("rejected") ||
    lc.includes("not selected") ||
    lc.includes("declined")
  )
    inferredStatus = "rejected";
  else if (
    lc.includes("application") ||
    lc.includes("applied") ||
    lc.includes("thanks for applying")
  )
    inferredStatus = "applied";

  // Try to extract company from subject patterns: "Thanks for applying to X" / "Thanks for applying at X"
  let companyName = null;
  const toMatch =
    subject.match(/thanks for applying (?:to|at)\s+(.+)$/i) ||
    subject.match(/thanks for applying[:\s-]+(.+)$/i);
  if (toMatch) {
    companyName = toMatch[1].replace(/[-–—].*$/, "").trim();
  } else {
    // "TeamViewer - Thank you for applying for Staff Software Engineer"
    const atMatch = subject.match(
      /^(?:.+?)\s*[-–—]\s*(?:thank you|thanks|thank|you have applied|thank you for applying)/i
    );
    if (atMatch) {
      // company is left part
      const left = subject.split(/[-–—]/)[0].trim();
      if (left && left.length < 80) companyName = left;
    }
  }

  // Job title guess: "applying for X", "application for X", or suffix after "for"
  let jobTitle = null;
  const jobMatch =
    plain.match(
      /(?:applying for|applying to|application for|thank you for applying for|you applied for)\s+([A-Z][A-Za-z0-9 &\-().,]{3,120})/i
    ) ||
    subject.match(/for the position of\s+(.+?)(?:$|[-,])/i) ||
    subject.match(/for\s+(.+?)(?:$|[-,])/i);

  if (jobMatch) jobTitle = (jobMatch[1] || jobMatch[0]).trim();

  // Fallback: from-header's display or domain
  if (!companyName) {
    const { display, domainCandidate } = extractFromHeader(
      htmlBody ? htmlBody : subject
    ); // attempt; this is safe
    if (display) companyName = display;
    else if (domainCandidate) companyName = capitalizeWords(domainCandidate);
  }

  // Build detection score & reasons (0..100)
  let score = 0;
  const reasons = [];
  if (companyName) {
    score += 40;
    reasons.push("Company inferred from subject/header");
  }
  if (jobTitle) {
    score += 40;
    reasons.push("Job title detected in email");
  }
  if (inferredStatus) {
    score += 10;
    reasons.push("Status keyword found");
  }
  // avoid >100
  score = Math.max(0, Math.min(100, score));

  return {
    source: "generic",
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    inferredStatus: inferredStatus || null,
    note: "Generic parser fallback",
    detection: { score, reasons },
  };
}
