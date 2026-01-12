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
  // attempt to find a phrase containing common title keywords
  const chunks = text
    .split(/[\n\r]/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const c of chunks) {
    for (const kw of commonTitleKeywords) {
      const m = c.match(
        new RegExp(
          `([A-Z][A-Za-z0-9 &\\-().]{2,120} ${kw}[A-Za-z0-9 &\\-().]*)`,
          "i"
        )
      );
      if (m) return m[1].trim();
    }
  }
  // fallback: look for "Application submitted <title>"
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
  const content = (textBody || htmlBody || subject || "")
    .replace(/\s+/g, " ")
    .trim();

  // Try these in order:
  // 1. subject like "Application submitted - <Job Title> - <Company>"
  let jobTitle = null;
  let companyName = null;

  // subject pattern: "Application submitted — <JobTitle> — <Company> — Location"
  const subjParts = subject
    .split(/[-–—|:]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (subjParts.length >= 2) {
    // find part that looks like a title (contains a common keyword)
    for (const part of subjParts) {
      for (const kw of commonTitleKeywords) {
        if (new RegExp(`\\b${kw}\\b`, "i").test(part)) {
          if (!jobTitle) jobTitle = part;
        }
      }
    }
    // company likely the last part (fallback)
    if (!companyName && subjParts.length >= 2)
      companyName = subjParts[subjParts.length - 1];
  }

  // 2. Body heuristics
  if (!jobTitle) jobTitle = guessTitleFromText(content);
  // body often contains a line: "<JobTitle>\n<Company> - <Location>"
  const companyMatch = content.match(
    /(?:\n|^|>)([A-Z][A-Za-z0-9 &\-.]{2,80})\s*-\s*[A-Za-z ,]{2,60}/
  );
  if (companyMatch && !companyName) companyName = companyMatch[1].trim();

  // 3. From header domain fallback
  if (!companyName) {
    const { display, domainCandidate } = extractFromHeader(htmlBody || subject);
    if (display) companyName = display;
    else if (domainCandidate) companyName = capitalizeWords(domainCandidate);
  }

  // confidence
  let score = 0;
  const reasons = [];
  if (companyName) {
    score += 45;
    reasons.push("Company detected");
  }
  if (jobTitle) {
    score += 45;
    reasons.push("Job title detected");
  }
  if (score === 0) {
    score = 5;
    reasons.push("Very low signal (Indeed)");
  }
  score = Math.min(100, score);

  return {
    source: "indeed",
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    inferredStatus: "applied",
    note: "Parsed using Indeed heuristics",
    detection: { score, reasons },
  };
}
