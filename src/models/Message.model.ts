import mongoose, { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: String, required: true }, // better-auth user ID
    recipientId: { type: String, required: true }, // better-auth user ID
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null }, // timestamp when recipient received it
  },
  { timestamps: true }
);

// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });

export default models.Message || model("Message", MessageSchema);
