import mongoose, { Schema, model, models } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: {
      type: [String], // array of user IDs (better-auth)
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 2,
        message: "Conversation must have exactly 2 participants",
      },
    },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null }, // optional, for context
    lastMessage: {
      type: String, // ref to Message ID
      default: null,
    },
    lastMessageAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique index: ensure only one conversation between two participants
ConversationSchema.index(
  { participants: 1 },
  {
    unique: true,
    sparse: true,
    // Custom uniqueness: sort participants so [A, B] and [B, A] are treated as same
  }
);

ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ isActive: 1 });

export default models.Conversation || model("Conversation", ConversationSchema);
