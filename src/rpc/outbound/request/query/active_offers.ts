import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const QueryActiveOffersRequestDataSchema = v.object({
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(PeerIdOutputSchema)),
});

export type QueryActiveOffersRequestData = v.InferInput<
  typeof QueryActiveOffersRequestDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryActiveOffers"),
  id: v.number(),
  data: QueryActiveOffersRequestDataSchema,
});
