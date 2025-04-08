import * as v from "valibot";

export const DataSchema = v.object({
  protocol_id: v.string(),
  offer_id: v.string(),
  protocol_payload: v.string(),
});

export type ProviderProvideData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderProvide"),
  id: v.number(),
  data: DataSchema,
});
