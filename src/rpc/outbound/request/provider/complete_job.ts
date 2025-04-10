import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const ProviderCompleteJobDataSchema = v.object({
  provider_peer_id: PeerIdOutputSchema,
  provider_job_id: v.string(),
  balance_delta: v.nullable(v.string()),
  public_payload: v.string(),
  private_payload: v.optional(v.string()),
});

export type ProviderCompleteJobData = v.InferInput<
  typeof ProviderCompleteJobDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderCompleteJob"),
  id: v.number(),
  data: ProviderCompleteJobDataSchema,
});
