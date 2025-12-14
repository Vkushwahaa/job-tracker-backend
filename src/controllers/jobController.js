import JobApplication from "../models/jobApplication.js";
import User from "../models/user.js";

export const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const findUser = await User.findById({ _id: userId });
    if (!findUser) {
      return res.status(404).json({ message: "user not found" });
    }
    const { companyName, jobTitle, status, applyDate, jobLink, source, notes } =
      req.body;
    if (!companyName || !jobTitle) {
      return res
        .status(400)
        .json({ messege: "company name || job title required" });
    }
    const job = await JobApplication.create({
      userId: userId,
      companyName,
      jobTitle,
      status,
      applyDate,
      jobLink,
      source,
      notes,
    });
    res.status(201).json({ messege: "job created succefully", job });
  } catch (err) {
    res.status(500).json({ message: "Server errorr", err });
  }
};

// export const getJobs = async (req, res) => {
//   try {
//     const jobs = await JobApplication.find({ userId: req.user.id }).sort({
//       createdAt: -1,
//     });
//     res.status(200).json({ message: "job fetched successfully", jobs });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err });
//   }
// };

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updatedJob = await JobApplication.findOneAndUpdate(
      { _id: jobId, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedJob) {
      return res.status(404).json({ message: "job not found" });
    }
    res.status(200).json({ message: "job updated successfully", updatedJob });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const deleted = await JobApplication.findOneAndDelete({
      _id: jobId,
      userId: req.user.id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "job not found" });
    }
    res.status(200).json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

export const getSingleJob = async (req, res) => {
  try {
    const job = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({ job });
  } catch (err) {
    res.status(500).json({ message: "Server errorr", err });
  }
};
export const getJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    let {
      page = 1,
      limit = 20,
      q,
      status,
      source,
      sort = "-createdAt",
      from,
      to,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Validate numbers
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;

    const filter = { userId };

    // Status filter
    if (status) filter.status = status;

    // Source filter
    if (source) filter.source = source;

    // Search filter
    if (q) {
      filter.$or = [
        { companyName: { $regex: q, $options: "i" } },
        { jobTitle: { $regex: q, $options: "i" } },
      ];
    }

    // Date range filter
    if (from || to) {
      filter.applyDate = {};
      if (from) filter.applyDate.$gte = new Date(from);
      if (to) filter.applyDate.$lte = new Date(to);
    }
    // Pagination calc
    const skip = (page - 1) * limit;

    const total = await JobApplication.countDocuments({ userId: userId });

    const jobs = await JobApplication.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
        hasMore: page * limit < total,
      },
      data: jobs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
};
