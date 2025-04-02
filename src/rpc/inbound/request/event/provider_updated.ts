import * as v from "valibot";
import { ProviderRecordSchema } from "../../dto.js";

export const DataSchema = v.object({
  subscription_id: v.number(),
  payload: ProviderRecordSchema,
});

export type EventProviderUpdatedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("EventProviderUpdated"),
  id: v.number(),
  data: DataSchema,
});
