import * as v from "valibot";
import { PeerIdInputSchema } from "../../../common.js";

const DataSchema = v.object({
  provider_peer_id: PeerIdInputSchema,
  protocol_id: v.string(),
  offer_id: v.string(),
  provider_job_id: v.string(),
  created_at_sync: v.number(),
  job_args: v.optional(v.string()),
});

/**
 * The payload is *guaranteed* to be valid.
 */
export type ProviderCreateJobData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderCreateJob"),
  id: v.number(),
  data: DataSchema,
});
