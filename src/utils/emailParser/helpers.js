// utils/emailParser/helpers.js
export function capitalizeWords(s = "") {
  return s
    .replace(/[_\-\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function extractFromHeader(fromHeader = "") {
  // returns {display, domainCandidate}
  // Examples:
  // "Maker Lab <jobs@makerlab.com>" -> display: "Maker Lab", domainCandidate: "makerlab"
  // "indeedapply@indeed.com" -> display: null, domainCandidate: "indeed"
  if (!fromHeader) return { display: null, domainCandidate: null };

  // Name between quotes / before '<'
  const nameMatch = fromHeader.match(/^\s*"?([^"<]+?)"?\s*(?:<|$)/);
  let display = nameMatch ? nameMatch[1].trim() : null;
  if (display && display.toLowerCase().includes("@")) display = null; // it's actually an email

  // domain part
  const emailMatch = fromHeader.match(
    /<([^>]+)>|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
  );
  let domainCandidate = null;
  const email = emailMatch ? emailMatch[1] || emailMatch[2] : null;
  if (email) {
    const dom = email.split("@")[1] || "";
    const parts = dom.split(".");
    // choose second level if exists, else first
    domainCandidate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    domainCandidate = domainCandidate
      ? domainCandidate.replace(/[^a-z0-9]/gi, "")
      : null;
  }
  return { display: display ? display.trim() : null, domainCandidate };
}
