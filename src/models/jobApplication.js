import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "interview", "rejected", "selected"],
      default: "applied",
    },
    applyDate: {
      type: Date,
      default: Date.now,
    },
    jobLink: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["linkedin", "naukri", "internshala", "indeed", "other"],
      default: "other",
    },
    notes: {
      type: String,
      default: "",
    },
    autoFetched: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("JobApplication", jobApplicationSchema);
