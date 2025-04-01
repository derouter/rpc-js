import * as v from "valibot";

export const DataSchema = v.object({
  /**
   * `{@link provider_peer_id}`, `{@link offer_id}` and `{@link protocol_id}`
   * may remain the same, but `{@link protocol_payload}` changes.
   * Snapshot ID is unique per whole 4-tuple.
   */
  snapshot_id: v.number(),

  provider_peer_id: v.string(),
  offer_id: v.string(),
  protocol_id: v.string(),
  protocol_payload: v.unknown(),
});

/**
 * A new offer is discovered or updated.
 */
export type OfferUpdatedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("OfferUpdated"),
  id: v.number(),
  data: DataSchema,
});
