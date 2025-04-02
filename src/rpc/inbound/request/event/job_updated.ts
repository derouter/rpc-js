import * as v from "valibot";
import { JobRecordSchema } from "../../dto.js";

export const DataSchema = v.object({
  subscription_id: v.number(),
  payload: JobRecordSchema,
});

export type EventJobUpdatedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("EventJobUpdated"),
  id: v.number(),
  data: DataSchema,
});
