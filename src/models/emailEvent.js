// models/emailEvent.js
import mongoose from "mongoose";

const emailEventSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    messageId: { type: String, unique: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model("EmailEvent", emailEventSchema);
