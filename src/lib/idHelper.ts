import mongoose from "mongoose";

export function toObjectIdOrNull(id: unknown): mongoose.Types.ObjectId | null {
  if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
}

export function buildIdOrCustomQuery(id: unknown, customField: string) {
  const strId = String(id || "");
  const objId = toObjectIdOrNull(strId);
  if (objId) {
    return { $or: [{ _id: objId }, { [customField]: strId }] };
  }
  return { [customField]: strId };
}
