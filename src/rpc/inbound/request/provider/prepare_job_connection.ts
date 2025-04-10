import * as v from "valibot";
import { PeerIdInputSchema } from "../../../common.js";

export const DataSchema = v.object({
  provider_peer_id: PeerIdInputSchema,
  provider_job_id: v.string(),
});

export type ProviderPrepareJobConnectionData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderPrepareJobConnection"),
  id: v.number(),
  data: DataSchema,
});
