import * as v from "valibot";

const DataSchema = v.object({
  database_row_id_cursor: v.optional(v.number()),
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(v.string())),
  consumer_peer_ids: v.optional(v.array(v.string())),
  limit: v.number(),
});

export type QueryJobsRequestData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryJobs"),
  id: v.number(),
  data: DataSchema,
});
