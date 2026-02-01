import JobApplication from "../models/jobApplication.js";

function normalize(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleSimilarity(a, b) {
  if (!a || !b) return 0;
  const A = normalize(a);
  const B = normalize(b);
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.7;
  return 0;
}

function confidenceLevel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export async function applyGmailUpdate({ userId, parsedEmail }) {
  const parserScore = Math.min(
    100,
    Math.max(0, parsedEmail?.detection?.score || 0),
  );

  const {
    companyName,
    jobTitle,
    inferredStatus,
    messageId,
    threadId,
    subject,
    note,
    sender,
  } = parsedEmail;

  const now = new Date();
  if (!companyName && !jobTitle) {
    return { type: "ignored", confidence: 0 };
  }

  // 1. HARD MATCH
  const hardMatch = await JobApplication.findOne({
    userId,
    $or: [
      { "sourceMeta.messageId": messageId },
      { "sourceMeta.threadId": threadId },
    ],
  });

  if (hardMatch) {
    hardMatch.status = inferredStatus ?? hardMatch.status;
    hardMatch.autoFetched = true;
    hardMatch.source = "gmail";
    hardMatch.lastActivityAt = now;
    hardMatch.confidence = {
      score: 100,
      level: "high",
      reasons: ["Exact Gmail thread match"],
      needsReview: false,
    };

    await hardMatch.save();
    return { type: "updated", confidence: 100 };
  }

  // 2. SCORE MATCHING
  const candidates = companyName
    ? await JobApplication.find({
        userId,
        "company.name": new RegExp(companyName, "i"),
        archived: false,
      })
    : [];

  let bestJob = null;
  let bestScore = 0;

  for (const job of candidates) {
    let score = Math.max(40, parserScore);

    score += Math.round(titleSimilarity(job.job.title, jobTitle) * 30);
    if (inferredStatus) score += 10;
    if (job.source === "gmail") score += 10;
    if (job.lastActivityAt && now - job.lastActivityAt < 30 * 86400000)
      score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestJob = job;
    }
  }

  // Use parser score when no candidate matches (ensures newly created jobs get a meaningful confidence)
  const effectiveScore = Math.max(bestScore, parserScore);
  const level = confidenceLevel(effectiveScore);
  const confidence = {
    score: effectiveScore,
    level,
    reasons: [
      "Company name matched",
      jobTitle && "Job title similarity",
      inferredStatus && "Status inferred from email",
    ].filter(Boolean),
    needsReview: level !== "high",
  };

  // 3. UPDATE EXISTING
  if (bestJob && bestScore >= 40) {
    bestJob.status = inferredStatus ?? bestJob.status;
    bestJob.autoFetched = true;
    bestJob.source = "gmail";
    bestJob.lastActivityAt = now;
    bestJob.confidence = confidence;
    bestJob.notes =
      (bestJob.notes || "") +
      `\n[Gmail ${level} confidence • ${effectiveScore}%] ${subject}`;

    await bestJob.save();

    return {
      type: level === "high" ? "updated" : "soft-updated",
      confidence: effectiveScore,
    };
  }
  if (!companyName || !jobTitle) {
    return { type: "ignored", confidence: effectiveScore };
  }
  // 4. CREATE NEW
  await JobApplication.create({
    userId,
    company: { name: companyName },
    job: { title: jobTitle },
    status: inferredStatus || "applied",
    source: "gmail",
    autoFetched: true,
    lastActivityAt: now,
    confidence: {
      score: effectiveScore,
      level,
      reasons: ["New job detected from Gmail"],
      needsReview: true,
    },
    notes: note,
    sourceMeta: {
      messageId,
      threadId,
      rawSubject: subject,
      rawSender: sender,
    },
    timeline: { appliedAt: now },
  });

  return { type: "created", confidence: bestScore };
}
