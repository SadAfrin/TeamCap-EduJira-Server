import mongoose, { Schema, model, models } from "mongoose";

export interface IMessage {
  senderRole: "parent" | "teacher";
  senderName: string;
  senderEmail: string;
  text: string;
  sentAt: Date;
  isRead: boolean;
}

export interface IMessageThread {
  parentId: string;
  parentName: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  className?: string;
  subjectName?: string;
  messages: IMessage[];
  lastMessage?: string;
  lastMessageAt?: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderRole: { type: String, enum: ["parent", "teacher"], required: true },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  text: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const MessageThreadSchema = new Schema<IMessageThread>(
  {
    parentId: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    teacherId: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    className: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    messages: { type: [MessageSchema], default: [] },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "message_threads" }
);

export default models.MessageThread ||
  model<IMessageThread>("MessageThread", MessageThreadSchema);
