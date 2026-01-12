// utils/emailParser/index.js
import { detectSource } from "./detectSource.js";
import { parseIndeedEmail } from "./indeed.js";
import { parseNaukriEmail } from "./naukri.js";
import { parseInternshalaEmail } from "./internshala.js";
import { parseGenericEmail } from "./generic.js";

export function parseGmailMessage(message) {
  const { from = "", subject = "", textBody = "", htmlBody = "" } = message;
  const source = detectSource({ from, subject });

  let parsed = null;
  switch (source) {
    case "indeed":
      parsed = parseIndeedEmail({ subject, textBody, htmlBody });
      break;
    case "naukri":
      parsed = parseNaukriEmail({ subject, textBody, htmlBody });
      break;
    case "internshala":
      parsed = parseInternshalaEmail({ subject, textBody, htmlBody });
      break;
    default:
      parsed = parseGenericEmail({ subject, textBody, htmlBody });
  }

  // ensure keys expected by rest of system are present
  return {
    companyName: parsed.companyName || null,
    jobTitle: parsed.jobTitle || null,
    inferredStatus: parsed.inferredStatus || null,
    note: parsed.note || null,
    source: parsed.source,
    // detection block is optional metadata your backend can use for logging/UI; applyGmailUpdate ignores it safely.
    detection: parsed.detection || { score: 0, reasons: [] },
    // lower-level metadata
    messageId: message.id || null,
    threadId: message.threadId || null,
    subject: subject || null,
    sender: from || null,
  };
}
