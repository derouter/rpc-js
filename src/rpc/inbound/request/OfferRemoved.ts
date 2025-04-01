import * as v from "valibot";

export const DataSchema = v.object({
  provider_peer_id: v.string(),
  offer_id: v.string(),
  protocol_id: v.string(),
});

/**
 * This offer is now explicitly inactive.
 */
export type OfferRemovedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("OfferRemoved"),
  id: v.number(),
  data: DataSchema,
});
