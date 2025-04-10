import * as v from "valibot";
import { PeerIdOutputSchema } from "../../common.js";

export const FailJobDataDataSchema = v.object({
  provider_peer_id: PeerIdOutputSchema,
  provider_job_id: v.string(),
  reason: v.string(),
  reason_class: v.optional(v.number()),
  private_payload: v.optional(v.string()),
});

export type FailJobData = v.InferInput<typeof FailJobDataDataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("FailJob"),
  id: v.number(),
  data: FailJobDataDataSchema,
});
