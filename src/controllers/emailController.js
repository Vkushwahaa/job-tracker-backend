// controllers/emailController.js
import dotenv from "dotenv";
dotenv.config();

import EmailAccount from "../models/emailAccount.js";
import EmailEvent from "../models/emailEvent.js";
import JobApplication from "../models/jobApplication.js";
import { isJobEmail } from "../utils/emailClassifier.js";
import { getOAuthClient } from "../utils/googleOAuth.js";
import { google } from "googleapis";
import { syncGmailForUser } from "../services/gmailSyncService.js";

export const connectGmail = async (req, res) => {
  const oauth = getOAuthClient();

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: false,
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state: req.user.userId,
  });

  res.json({ url });
  console.log("AUTH USER ID:", req.user.userId);
};

export const syncGmailOnce = async (req, res) => {
  console.log(
    "SYNC START — access token exp:",
    req.user?.exp,
    "now:",
    Math.floor(Date.now() / 1000)
  );
  if (req.user.exp < Math.floor(Date.now() / 1000)) {
    return res
      .status(401)
      .json({ message: "Session expired. Please re-login." });
  }

  console.log("SYNC GMAIL API HIT for user:", req.user.userId);
  if (req.user.exp < Math.floor(Date.now() / 1000)) {
    return res
      .status(401)
      .json({ message: "Session expired. Please re-login." });
  }

  try {
    const result = await syncGmailForUser(req.user.userId, { limit: 10 });

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    // console.error("SYNC FAILED:", err?.name, err?.message, err?.stack);

    // const googleError = err.response?.data;

    // if (
    //   googleError?.error === "invalid_grant" ||
    //   googleError?.error_description?.includes("expired")
    // ) {
    //   await EmailAccount.updateOne(
    //     { userId: req.user.userId },
    //     { $set: { tokenInvalid: true, lastSyncedAt: new Date() } }
    //   );

    //   return res.status(401).json({
    //     code: "GMAIL_RECONNECT_REQUIRED",
    //     message: "Gmail access expired. Please reconnect.",
    //   });
    // }

    // res.status(500).json({
    //   message: "Gmail sync failed",
    //   error: err.message,
    // });

    const googleError = err.response?.data;

    if (
      googleError?.error === "invalid_grant" ||
      googleError?.error === "invalid_token"
    ) {
      await EmailAccount.updateOne(
        { userId: req.user.userId },
        {
          $set: {
            tokenInvalid: true,
            lastSyncedAt: new Date(),
          },
        }
      );

      return res.status(401).json({
        code: "GMAIL_RECONNECT_REQUIRED",
        message: "Gmail access expired. Please reconnect.",
      });
    }
  }
};
// http://localhost:3001/api/auth/gmail/callback flowName=GeneralOAuthFlow
export const gmailCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    const oauth = getOAuthClient();

    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth });
    const { data } = await oauth2.userinfo.get();

    await EmailAccount.findOneAndUpdate(
      { userId },
      {
        provider: "gmail",
        email: data.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenInvalid: false,
        tokenExpiry: new Date(tokens.expiry_date),
      },
      { upsert: true }
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    res.status(500).json({ message: "Gmail callback failed", err });
  }
};
// controllers/emailController.js
export const gmailStatus = async (req, res) => {
  const account = await EmailAccount.findOne({ userId: req.user.userId });

  if (!account) {
    return res.json({
      connected: false,
      email: null,
      lastSyncedAt: null,
    });
  }

  if (account.tokenInvalid === true) {
    return res.json({
      connected: false,
      expired: true,
      email: account.email,
      lastSyncedAt: account.lastSyncedAt,
    });
  }

  return res.json({
    connected: true,
    email: account.email,
    lastSyncedAt: account.lastSyncedAt,
  });
};

// /**
//  * Apply Gmail event to Job
//  * This is INTERNAL – never called by frontend directly
//  */
// export const applyGmailUpdate = async ({ userId, parsedEmail }) => {
//   const {
//     companyName,
//     jobTitle,
//     inferredStatus,
//     messageId,
//     threadId,
//     subject,
//     sender,
//   } = parsedEmail;

//   // 1. Try to find existing job by Gmail message / thread
//   let job = await JobApplication.findOne({
//     userId,
//     $or: [
//       { "sourceMeta.messageId": messageId },
//       { "sourceMeta.threadId": threadId },
//     ],
//   });

//   const now = new Date();

//   // 2. If job exists → UPDATE
//   if (job) {
//     const updatePayload = {
//       source: "gemail",
//       autoFetched: true,
//       lastActivityAt: now,
//       "sourceMeta.messageId": messageId,
//       "sourceMeta.threadId": threadId,
//       "sourceMeta.rawSubject": subject,
//       "sourceMeta.rawSender": sender,
//     };

//     // Status transition logic
//     if (inferredStatus && inferredStatus !== job.status) {
//       updatePayload.status = inferredStatus;

//       const timelineMap = {
//         applied: "appliedAt",
//         shortlisted: "shortlistedAt",
//         interview: "interviewAt",
//         offer: "offerAt",
//         rejected: "rejectedAt",
//       };

//       const timelineKey = timelineMap[inferredStatus];
//       if (timelineKey) {
//         updatePayload[`timeline.${timelineKey}`] = now;
//       }
//     }

//     await JobApplication.updateOne({ _id: job._id }, { $set: updatePayload });

//     return { type: "updated", jobId: job._id };
//   }

//   // 3. If NOT found → CREATE new job
//   const newJob = await JobApplication.create({
//     userId,
//     company: {
//       name: companyName || "Unknown",
//     },
//     job: {
//       title: jobTitle || subject,
//     },
//     status: inferredStatus || "applied",
//     source: "gemail",
//     autoFetched: true,
//     timeline: {
//       appliedAt: now,
//     },
//     sourceMeta: {
//       messageId,
//       threadId,
//       rawSubject: subject,
//       rawSender: sender,
//     },
//     lastActivityAt: now,
//   });

//   return { type: "created", jobId: newJob._id };
// };
