// models/emailAccount.js
import mongoose from "mongoose";

const emailAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    provider: {
      type: String,
      enum: ["gmail"],
      required: true,
    },
    autoSyncEnabled: {
      type: Boolean,
      default: false,
    },
    email: String,

    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,

    lastSyncedAt: Date,
    tokenInvalid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("EmailAccount", emailAccountSchema);
