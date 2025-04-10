import * as v from "valibot";
import { PeerIdOutputSchema } from "../../../common.js";

export const SubscribeToActiveOffersRequestDataSchema = v.object({
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(PeerIdOutputSchema)),
});

export type SubscribeToActiveOffersRequestData = v.InferInput<
  typeof SubscribeToActiveOffersRequestDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("SubscribeToActiveOffers"),
  id: v.number(),
  data: SubscribeToActiveOffersRequestDataSchema,
});
