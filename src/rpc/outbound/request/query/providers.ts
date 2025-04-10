import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const QueryProvidersRequestDataSchema = v.object({
  provider_peer_ids: v.array(PeerIdOutputSchema),
});

export type QueryProvidersRequestData = v.InferInput<
  typeof QueryProvidersRequestDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryProviders"),
  id: v.number(),
  data: QueryProvidersRequestDataSchema,
});
