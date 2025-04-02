import * as v from "valibot";
import { ProviderHeartbeatSchema } from "../../dto.js";

export const DataSchema = v.object({
  subscription_id: v.number(),
  payload: ProviderHeartbeatSchema,
});

export type EventProviderHeartbeatData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("EventProviderHeartbeat"),
  id: v.number(),
  data: DataSchema,
});
