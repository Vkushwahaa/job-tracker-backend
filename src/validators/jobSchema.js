import { z } from "zod";

export const createJobSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  status: z.enum(["applied", "interview", "rejected", "selected"]).optional(),
  jobLink: z.string().url().optional().or(z.literal("")),
  source: z
    .enum(["linkedin", "naukri", "internshala", "indeed", "other"])
    .optional(),
  notes: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial();
