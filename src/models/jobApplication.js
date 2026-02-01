// import mongoose from "mongoose";

// const jobApplicationSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     companyName: {
//       type: String,
//       required: true,
//     },
//     jobTitle: {
//       type: String,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["applied", "interview", "rejected", "selected"],
//       default: "applied",
//     },
//     applyDate: {
//       type: Date,
//       default: Date.now,
//     },
//     jobLink: {
//       type: String,
//       default: "",
//     },
//     source: {
//       type: String,
//       enum: ["linkedin", "naukri", "internshala", "indeed", "other"],
//       default: "other",
//     },
//     notes: {
//       type: String,
//       default: "",
//     },
//     autoFetched: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("JobApplication", jobApplicationSchema);

import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    // ─────────────────────────────
    // Ownership
    // ─────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─────────────────────────────
    // Job Identity
    // ─────────────────────────────
    company: {
      name: {
        type: String,
        required: true,
        index: true,
      },
      website: String,
      location: String,
      domain: String, // for enrichment later
    },

    job: {
      title: {
        type: String,
        required: true,
      },
      link: {
        type: String,
      },
      description: {
        type: String,
      },
    },

    // ─────────────────────────────
    // Application Lifecycle
    // ─────────────────────────────
    status: {
      type: String,
      enum: [
        "draft",
        "applied",
        "shortlisted",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
      index: true,
    },

    timeline: {
      appliedAt: Date,
      shortlistedAt: Date,
      interviewAt: Date,
      offerAt: Date,
      rejectedAt: Date,
      withdrawnAt: Date,
    },

    // ─────────────────────────────
    // Source & Automation Metadata
    // ─────────────────────────────
    source: {
      type: String,
      enum: ["linkedin", "naukri", "internshala", "indeed", "gmail", "manual"],
      default: "manual",
      index: true,
    },

    sourceMeta: {
      emailId: String, // for email ingestion
      messageId: { type: String, index: true }, // already good
      threadId: { type: String },
      rawSubject: String,
      rawSender: String,
    },

    autoFetched: {
      type: Boolean,
      default: false,
    },

    gmailMeta: {
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      lastGmailUpdateAt: Date,
    },

    // ─────────────────────────────
    // Notes & Review
    // ─────────────────────────────
    notes: {
      type: String,
      default: "",
    },
    confidence: {
      score: { type: Number }, // 0–100
      level: {
        type: String,
        enum: ["high", "medium", "low"],
      },
      reasons: [String], // explanations
      needsReview: { type: Boolean }, // UI flag
    },

    // ─────────────────────────────
    // Cleanup & Intelligence (future)
    // ─────────────────────────────
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("JobApplication", jobApplicationSchema);
