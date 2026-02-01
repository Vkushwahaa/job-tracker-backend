// import { z } from "zod";

// export const createJobSchema = z.object({
//   companyName: z.string().min(1),
//   jobTitle: z.string().min(1),
//   status: z.enum(["applied", "interview", "rejected", "selected"]).optional(),
//   jobLink: z.string().url().optional().or(z.literal("")),
//   source: z
//     .enum(["linkedin", "naukri", "internshala", "indeed", "other"])
//     .optional(),
//   notes: z.string().optional(),
// });

// export const updateJobSchema = createJobSchema.partial();

import { z } from "zod";

/**
 * Shared enums
 */
export const JobStatusEnum = z.enum([
  "draft",
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

export const JobSourceEnum = z.enum([
  "linkedin",
  "naukri",
  "internshala",
  "indeed",
  "email",
  "manual",
]);

/**
 * Create Job Application
 * Used when user creates or auto-imports a job
 */
export const createJobSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    website: z.string().url().optional(),
    location: z.string().optional(),
    domain: z.string().optional(),
  }),

  job: z.object({
    title: z.string().min(1, "Job title is required"),
    link: z.string().url().optional(),
    description: z.string().optional(),
  }),

  source: JobSourceEnum.default("manual"),

  notes: z.string().optional(),
});

/**
 * Update Job Application
 * Allows controlled updates only
 */
export const updateJobSchema = z.object({
  company: z
    .object({
      name: z.string().min(1),
      website: z.string().optional(),
      location: z.string().optional(),
      domain: z.string().optional(),
    })
    .optional(),

  job: z
    .object({
      title: z.string().min(1),
      link: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  status: JobStatusEnum.optional(),

  notes: z.string().optional(),

  archived: z.boolean().optional(),
});

/**
 * Internal schema (NOT exposed to client)
 * Used by automation / email ingestion / LLM
 */
export const internalJobUpdateSchema = z.object({
  status: JobStatusEnum.optional(),

  timeline: z
    .object({
      appliedAt: z.date().optional(),
      shortlistedAt: z.date().optional(),
      interviewAt: z.date().optional(),
      offerAt: z.date().optional(),
      rejectedAt: z.date().optional(),
      withdrawnAt: z.date().optional(),
    })
    .optional(),

  sourceMeta: z
    .object({
      emailId: z.string().optional(),
      messageId: z.string().optional(),
      rawSubject: z.string().optional(),
      rawSender: z.string().optional(),
    })
    .optional(),

  autoFetched: z.boolean().optional(),
});
