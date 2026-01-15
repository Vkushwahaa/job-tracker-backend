// utils/emailParser/indeed.js
import { extractFromHeader, capitalizeWords } from "./helpers.js";

const commonTitleKeywords = [
  "engineer",
  "developer",
  "intern",
  "analyst",
  "manager",
  "designer",
  "scientist",
  "consultant",
];

function guessTitleFromText(text = "") {
  const chunks = text
    .split(/[\n\r]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const c of chunks) {
    for (const kw of commonTitleKeywords) {
      const m = c.match(
        new RegExp(
          `([A-Z][A-Za-z0-9 &\\-().]{2,120}\\s+${kw}[A-Za-z0-9 &\\-().]*)`,
          "i"
        )
      );
      if (m) return m[1].trim();
    }
  }

  // fallback: "Application submitted: <Job Title>"
  const fallback = text.match(
    /Application submitted[:\s-]*([A-Z][A-Za-z0-9 &\-\(\).,]{3,120})/i
  );
  if (fallback) return fallback[1].trim();

  return null;
}

export function parseIndeedEmail({
  subject = "",
  textBody = "",
  htmlBody = "",
}) {
  const content = (textBody || htmlBody || "").replace(/\s+/g, " ").trim();

  let jobTitle = null;
  let companyName = null;

  /* ---------------------------------------------
   * 1. SUBJECT → JOB TITLE ONLY (Indeed rule)
   * --------------------------------------------- */
  const subjParts = subject
    .split(/[-–—|:]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of subjParts) {
    for (const kw of commonTitleKeywords) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(part)) {
        jobTitle ??= part;
      }
    }
  }

  /* ---------------------------------------------
   * 2. BODY → COMPANY (Company - Location)
   * --------------------------------------------- */
  const companyMatch = content.match(
    /([A-Z][A-Za-z0-9 &.,()\-]{2,80})\s*-\s*[A-Za-z ,]{2,60}/
  );

  if (companyMatch) {
    companyName = companyMatch[1].trim();
  }

  /* ---------------------------------------------
   * 3. BODY → JOB TITLE (fallback)
   * --------------------------------------------- */
  if (!jobTitle) {
    jobTitle = guessTitleFromText(content);
  }

  /* ---------------------------------------------
   * 4. HEADER DOMAIN FALLBACK (last resort)
   * --------------------------------------------- */
  if (!companyName) {
    const { display, domainCandidate } = extractFromHeader(htmlBody || subject);
    if (display) companyName = display;
    else if (domainCandidate) companyName = capitalizeWords(domainCandidate);
  }

  /* ---------------------------------------------
   * 5. CONFIDENCE + SANITY CHECKS
   * --------------------------------------------- */
  let score = 0;
  const reasons = [];

  if (jobTitle) {
    score += 45;
    reasons.push("Job title detected");
  }

  if (companyName) {
    score += 45;
    reasons.push("Company detected");
  }

  // Hard guard: company must not equal title
  if (
    companyName &&
    jobTitle &&
    companyName.toLowerCase() === jobTitle.toLowerCase()
  ) {
    score = Math.min(score, 40);
    reasons.push("Company equals job title (invalid)");
  }

  // Indeed penalty (less structured emails)
  score = Math.max(0, Math.min(100, score - 10));

  if (score === 0) {
    score = 5;
    reasons.push("Very low signal (Indeed)");
  }

  /* ---------------------------------------------
   * 6. FINAL OUTPUT
   * --------------------------------------------- */
  return {
    source: "indeed",
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    inferredStatus: "applied",
    note: "Parsed using Indeed heuristics",
    detection: {
      score,
      reasons,
    },
  };
}
