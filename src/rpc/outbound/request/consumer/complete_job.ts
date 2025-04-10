import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const ConsumerCompleteJobDataSchema = v.object({
  provider_peer_id: PeerIdOutputSchema,
  provider_job_id: v.string(),
  public_payload: v.string(),
  private_payload: v.optional(v.string()),
  balance_delta: v.nullable(v.string()),
  completed_at_sync: v.number(),
});

export type ConsumerCompleteJobData = v.InferInput<
  typeof ConsumerCompleteJobDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerCompleteJob"),
  id: v.number(),
  data: ConsumerCompleteJobDataSchema,
});
