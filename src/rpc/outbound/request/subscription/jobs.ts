import * as v from "valibot";

const DataSchema = v.object({
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(v.string())),
  consumer_peer_ids: v.optional(v.array(v.string())),
});

export type SubscribeToJobsRequestData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("SubscribeToJobs"),
  id: v.number(),
  data: DataSchema,
});
