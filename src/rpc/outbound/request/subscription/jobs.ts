import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const SubscribeToJobsRequestDataSchema = v.object({
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(PeerIdOutputSchema)),
  consumer_peer_ids: v.optional(v.array(PeerIdOutputSchema)),
});

export type SubscribeToJobsRequestData = v.InferInput<
  typeof SubscribeToJobsRequestDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("SubscribeToJobs"),
  id: v.number(),
  data: SubscribeToJobsRequestDataSchema,
});
