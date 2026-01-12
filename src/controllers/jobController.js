// import JobApplication from "../models/jobApplication.js";
// import User from "../models/user.js";

// export const createJob = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const findUser = await User.findById({ _id: userId });
//     if (!findUser) {
//       return res.status(404).json({ message: "user not found" });
//     }
//     const { companyName, jobTitle, status, applyDate, jobLink, source, notes } =
//       req.body;
//     if (!companyName || !jobTitle) {
//       return res
//         .status(400)
//         .json({ messege: "company name || job title required" });
//     }
//     const job = await JobApplication.create({
//       userId: userId,
//       companyName,
//       jobTitle,
//       status,
//       applyDate,
//       jobLink,
//       source,
//       notes,
//     });
//     res.status(201).json({ messege: "job created succefully", job });
//   } catch (err) {
//     res.status(500).json({ message: "Server errorr", err });
//   }
// };

// // export const getJobs = async (req, res) => {
// //   try {
// //     const jobs = await JobApplication.find({ userId: req.user.id }).sort({
// //       createdAt: -1,
// //     });
// //     res.status(200).json({ message: "job fetched successfully", jobs });
// //   } catch (err) {
// //     res.status(500).json({ message: "Server error", err });
// //   }
// // };

// export const updateJob = async (req, res) => {
//   try {
//     const jobId = req.params.id;
//     const updatedJob = await JobApplication.findOneAndUpdate(
//       { _id: jobId, userId: req.userId },
//       req.body,
//       { new: true }
//     );
//     if (!updatedJob) {
//       return res.status(404).json({ message: "job not found" });
//     }
//     res.status(200).json({ message: "job updated successfully", updatedJob });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err });
//   }
// };

// export const deleteJob = async (req, res) => {
//   try {
//     const jobId = req.params.id;
//     const deleted = await JobApplication.findOneAndDelete({
//       _id: jobId,
//       userId: req.userId,
//     });
//     if (!deleted) {
//       return res.status(404).json({ message: "job not found" });
//     }
//     res.status(200).json({ message: "Job deleted" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err });
//   }
// };

// export const getSingleJob = async (req, res) => {
//   try {
//     const job = await JobApplication.findOne({
//       _id: req.params.id,
//       userId: req.userId,
//     });
//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }
//     res.status(200).json({ job });
//   } catch (err) {
//     res.status(500).json({ message: "Server errorr", err });
//   }
// };
// export const getJobs = async (req, res) => {
//   try {
//     const userId = req.userId;
//     let {
//       page = 1,
//       limit = 20,
//       q,
//       status,
//       source,
//       sort = "-createdAt",
//       from,
//       to,
//     } = req.query;

//     page = parseInt(page);
//     limit = parseInt(limit);

//     // Validate numbers
//     if (page < 1) page = 1;
//     if (limit < 1) limit = 20;

//     const filter = { userId };

//     // Status filter
//     if (status) filter.status = status;

//     // Source filter
//     if (source) filter.source = source;

//     // Search filter
//     if (q) {
//       filter.$or = [
//         { companyName: { $regex: q, $options: "i" } },
//         { jobTitle: { $regex: q, $options: "i" } },
//       ];
//     }

//     // Date range filter
//     if (from || to) {
//       filter.applyDate = {};
//       if (from) filter.applyDate.$gte = new Date(from);
//       if (to) filter.applyDate.$lte = new Date(to);
//     }
//     // Pagination calc
//     const skip = (page - 1) * limit;

//     const total = await JobApplication.countDocuments({ userId: userId });

//     const jobs = await JobApplication.find(filter)
//       .sort(sort)
//       .skip(skip)
//       .limit(limit);

//     res.json({
//       success: true,
//       meta: {
//         total,
//         page,
//         limit,
//         pages: Math.max(1, Math.ceil(total / limit)),
//         hasMore: page * limit < total,
//       },
//       data: jobs,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error", err });
//   }
// };

import JobApplication from "../models/jobApplication.js";
import User from "../models/user.js";
import { createJobSchema, updateJobSchema } from "../validators/jobSchema.js";

/**
 * Create Job
 */
export const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const { company, job, source, notes } = parsed.data;

    const jobApplication = await JobApplication.create({
      userId,
      company,
      job,
      source,
      notes,
      status: "applied",
      timeline: {
        appliedAt: new Date(),
      },
      lastActivityAt: new Date(),
      autoFetched: false,
    });

    res.status(201).json({
      message: "Job created successfully",
      job: jobApplication,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

/**
 * Update Job
 * Only controlled updates allowed
 */
export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    const parsed = updateJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const updates = parsed.data;
    const updatePayload = { ...updates };

    // Auto timeline updates
    if (updates.status) {
      const now = new Date();
      const timelineMap = {
        applied: "appliedAt",
        shortlisted: "shortlistedAt",
        interview: "interviewAt",
        offer: "offerAt",
        rejected: "rejectedAt",
        withdrawn: "withdrawnAt",
      };

      const key = timelineMap[updates.status];
      if (key) {
        updatePayload[`timeline.${key}`] = now;
      }
    }

    const job = await JobApplication.findOneAndUpdate(
      { _id: jobId, userId: req.user.userId },
      { $set: updatePayload },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job updated successfully", job });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

/**
 * Delete Job (soft delete ready)
 */
export const deleteJob = async (req, res) => {
  try {
    const job = await JobApplication.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

function normalizeJob(job) {
  const j = job.toObject();

  // Backward compatibility
  if (!j.company && j.companyName) {
    j.company = { name: j.companyName };
  }

  if (!j.job && j.jobTitle) {
    j.job = { title: j.jobTitle };
  }

  return j;
}

/**
 * Get Single Job
 */
export const getSingleJob = async (req, res) => {
  try {
    const job = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // res.json({ job });
    res.json({ job: normalizeJob(job) });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

/**
 * Get Jobs (search + filters)
 */
export const getJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    let {
      page = 1,
      limit = 20,
      q,
      status,
      source,
      sort = "-createdAt",
    } = req.query;

    page = Math.max(parseInt(page), 1);
    limit = Math.max(parseInt(limit), 1);

    const filter = { userId };

    if (status) filter.status = status;
    if (source) filter.source = source;

    if (q) {
      filter.$or = [
        { "company.name": { $regex: q, $options: "i" } },
        { "job.title": { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      JobApplication.find(filter).sort(sort).skip(skip).limit(limit),
      JobApplication.countDocuments(filter),
    ]);

    res.json({
      data: jobs.map(normalizeJob),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};
export const approveGmailJob = async (req, res) => {
  const job = await JobApplication.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (!job.autoFetched) {
    return res.status(400).json({ message: "Not a Gmail job" });
  }

  job.confidence.needsReview = false;
  job.confidence.level = "high";

  await job.save();

  res.json({ message: "Gmail job approved", job });
};
