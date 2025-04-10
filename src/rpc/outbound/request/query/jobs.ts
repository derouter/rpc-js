import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const QueryJobsRequestDataSchema = v.object({
  database_row_id_cursor: v.optional(v.number()),
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(PeerIdOutputSchema)),
  consumer_peer_ids: v.optional(v.array(PeerIdOutputSchema)),
  limit: v.number(),
});

export type QueryJobsRequestData = v.InferInput<
  typeof QueryJobsRequestDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryJobs"),
  id: v.number(),
  data: QueryJobsRequestDataSchema,
});
