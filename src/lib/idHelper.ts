import mongoose from "mongoose";

export function toObjectIdOrNull(id: unknown): mongoose.Types.ObjectId | null {
  if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
}

export function buildIdOrCustomQuery(id: unknown, customField: string) {
  const strId = String(id || "").trim();
  const objId = toObjectIdOrNull(strId);
  const conditions: any[] = [
    { [customField]: strId },
    { email: strId.toLowerCase() },
  ];
  if (objId) {
    conditions.unshift({ _id: objId });
  }
  return { $or: conditions };
}
