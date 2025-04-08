import * as v from "valibot";

export const DataSchema = v.object({
  customer_peer_id: v.string(),
  protocol_id: v.string(),
  offer_id: v.string(),
  protocol_payload: v.string(),
  connection_id: v.number(),
});

export type ProviderOpenConnectionData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderOpenConnection"),
  id: v.number(),
  data: DataSchema,
});
