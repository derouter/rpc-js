import * as v from "valibot";

const DataSchema = v.object({
  protocol_ids: v.optional(v.array(v.string())),
  provider_peer_ids: v.optional(v.array(v.string())),
});

export type QueryActiveOffersRequestData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryActiveOffers"),
  id: v.number(),
  data: DataSchema,
});
