import { google } from "googleapis";
import EmailAccount from "../models/emailAccount.js";
import EmailEvent from "../models/emailEvent.js";
import { isJobEmail } from "../utils/emailClassifier.js";
import { getOAuthClient } from "../utils/googleOAuth.js";
import { applyGmailUpdate } from "./applyGmailUpdate.js";
import { parseGmailMessage } from "../utils/emailParser/index.js";
import { aiParseEmail } from "../services/aiParser.js";

export async function syncGmailForUser(userId, { limit = 10 } = {}) {
  let aiCallsUsed = 0;
  const AI_CALL_LIMIT = 3;

  console.log("ENTERED syncGmailForUser:", userId);
  let ignored = 0;
  const account = await EmailAccount.findOne({ userId });
  if (!account) return { skipped: true };

  const oauth = getOAuthClient();

  oauth.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });
  // const tokenInfo = await oauth.getTokenInfo(account.accessToken);
  // console.log("TOKEN SCOPES AT SYNC TIME:", tokenInfo.scopes);

  const gmail = google.gmail({ version: "v1", auth: oauth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: limit,
  });
  console.log("GMAIL MESSAGE COUNT:", list.data.messages?.length);

  let created = 0;
  let updated = 0;

  for (const msg of list.data.messages || []) {
    console.log("PROCESSING MESSAGE ID:", msg.id);
    // Idempotency check
    const exists = await EmailEvent.findOne({ messageId: msg.id });
    if (exists) continue;

    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const headers = full.data.payload.headers || [];
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const from = headers.find((h) => h.name === "From")?.value || "";

    // if (!isJobEmail(subject, from)) continue;

    // function getTextBody(payload) {
    //   if (!payload) return "";

    //   // If body is directly present
    //   if (payload.body?.data) {
    //     return Buffer.from(payload.body.data, "base64").toString("utf-8");
    //   }

    //   // Multipart email
    //   if (payload.parts) {
    //     for (const part of payload.parts) {
    //       if (part.mimeType === "text/plain") {
    //         return Buffer.from(part.body.data || "", "base64").toString(
    //           "utf-8"
    //         );
    //       }
    //     }
    //   }

    //   return "";
    // }
    function getEmailBodies(payload) {
      let text = "";
      let html = "";

      if (!payload) return { text, html };

      if (payload.body?.data) {
        text = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }

      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain") {
            text += Buffer.from(part.body.data || "", "base64").toString(
              "utf-8"
            );
          }
          if (part.mimeType === "text/html") {
            html += Buffer.from(part.body.data || "", "base64").toString(
              "utf-8"
            );
          }
        }
      }

      return { text, html };
    }

    // const jobData = extractJobData(subject, full.data.snippet);
    const { text, html } = getEmailBodies(full.data.payload);

    const parsedEmail = parseGmailMessage({
      id: msg.id,
      threadId: full.data.threadId,
      from,
      subject,
      textBody: text,
      htmlBody: html,
    });
    console.log("HEURISTIC PARSED:", parsedEmail);
    console.log("RAW EMAIL SUBJECT:", subject);
    console.log("RAW EMAIL FROM:", from);

    console.log("PARSED EMAIL:", parsedEmail);
    console.log("PARSER SCORE:", parsedEmail.detection);

    // 🔹 AI FALLBACK
    const needsAI =
      parsedEmail.detection?.score < 60 ||
      !parsedEmail.companyName ||
      !parsedEmail.jobTitle;

    if (needsAI && aiCallsUsed < AI_CALL_LIMIT) {
      try {
        const aiResult = await aiParseEmail({
          subject,
          from,
          textBody: text,
          htmlBody: html,
        });

        console.log("AI PARSED:", aiResult);

        // 🔹 MERGE (never overwrite strong data)
        // parsedEmail.companyName ??= aiResult.company.name;
        // parsedEmail.jobTitle ??= aiResult.job.title;
        if (aiResult?.company?.name) {
          parsedEmail.companyName ??= aiResult.company.name;
        }

        if (aiResult?.job?.title) {
          parsedEmail.jobTitle ??= aiResult.job.title;
        }

        parsedEmail.inferredStatus ??= aiResult.inferredStatus;

        // 🔹 Use BEST score
        parsedEmail.detection.score ??= Math.max(
          parsedEmail.detection.score || 0,
          aiResult.detection.score
        );

        parsedEmail.detection.reasons?.push(
          ...aiResult.detection.reasons.map((r) => `AI: ${r}`)
        );
        aiCallsUsed++;
      } catch (err) {
        console.warn("AI parsing skipped:", err.message);
      }
    }

    const result = await applyGmailUpdate({
      userId,
      // parsedEmail: {
      //   companyName: jobData.companyName,
      //   jobTitle: jobData.jobTitle,
      //   inferredStatus: jobData.status,
      //   messageId: msg.id,
      //   threadId: full.data.threadId,
      //   subject,
      //   sender: from,
      // },
      parsedEmail,
    });

    console.log("DECISION:", {
      companyName: parsedEmail.companyName,
      jobTitle: parsedEmail.jobTitle,
      inferredStatus: parsedEmail.inferredStatus,
      score: parsedEmail.detection?.score ?? 0,
      note: parsedEmail.note ?? "",
      action: result.type,
    });
    await EmailAccount.updateOne(
      { userId },
      { $set: { lastSyncedAt: new Date(), tokenInvalid: false } }
    );

    if (result.type === "created") created++;
    if (result.type === "updated") updated++;
    if (result.type === "ignored") {
      ignored++;
    }

    // if (!parsedEmail.companyName && !parsedEmail.jobTitle) {
    //   await EmailEvent.create({
    //     userId,
    //     messageId: msg.id,
    //     ignored: true,
    //     reason: "low_signal_email",
    //   });
    //   continue;
    // }
    await EmailEvent.create({
      userId,
      messageId: msg.id,
      processedAt: new Date(),
      confidence: parsedEmail.detection?.score ?? 0,
      companyName: parsedEmail.companyName ?? null,
      jobTitle: parsedEmail.jobTitle ?? null,
      note: parsedEmail.note ?? null,
      source: "gmail",
    });
  }

  return { created, updated, ignored };
}
