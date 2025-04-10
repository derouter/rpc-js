import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const ConsumerOpenJobConnectionDataSchema = v.object({
  provider_peer_id: PeerIdOutputSchema,
  provider_job_id: v.string(),
});

export type ConsumerOpenJobConnectionData = v.InferInput<
  typeof ConsumerOpenJobConnectionDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerOpenJobConnection"),
  id: v.number(),
  data: ConsumerOpenJobConnectionDataSchema,
});
