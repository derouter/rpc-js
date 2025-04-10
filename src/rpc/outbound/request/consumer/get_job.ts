import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const ConsumerGetJobDataSchema = v.object({
  provider_peer_id: PeerIdOutputSchema,
  provider_job_id: v.string(),
});

export type ConsumerGetJobData = v.InferInput<typeof ConsumerGetJobDataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerGetJob"),
  id: v.number(),
  data: ConsumerGetJobDataSchema,
});
