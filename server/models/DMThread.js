const mongoose = require("mongoose");

const DMThreadSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ], // exactly 2 ids
    // Deterministic key to guarantee one thread per pair (order independent)
    pairKey: { type: String, required: true, unique: true, index: true },
    initiator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Normalize participants order and set pairKey for uniqueness
DMThreadSchema.pre("validate", function (next) {
  if (Array.isArray(this.participants) && this.participants.length === 2) {
    const sorted = this.participants
      .map((id) => id.toString())
      .sort();

    this.participants = sorted.map((id) => new mongoose.Types.ObjectId(id));
    this.pairKey = `${sorted[0]}-${sorted[1]}`;
  }
  next();
});

// Sort by last activity
DMThreadSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("DMThread", DMThreadSchema);