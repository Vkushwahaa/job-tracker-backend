export function scoreEmailConfidence({ parsedEmail, job }) {
  let score = 0;

  if (parsedEmail.sender?.includes(job.company.domain)) {
    score += 0.3;
  }

  if (/interview|offer|shortlisted|rejected/i.test(parsedEmail.subject)) {
    score += 0.4;
  }

  if (/noreply|newsletter/i.test(parsedEmail.sender)) {
    score -= 0.5;
  }

  if (parsedEmail.threadId === job.sourceMeta?.threadId) {
    score += 0.2;
  }

  return Math.max(0, Math.min(score, 1));
}
