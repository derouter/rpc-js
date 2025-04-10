import * as v from "valibot";

export const ProviderProvideDataSchema = v.object({
  protocol_id: v.string(),
  offer_id: v.string(),
  protocol_payload: v.string(),
});

export type ProviderProvideData = v.InferInput<
  typeof ProviderProvideDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderProvide"),
  id: v.number(),
  data: ProviderProvideDataSchema,
});
