import * as v from "valibot";

export const DataSchema = v.object({
  connection_id: v.number(),
  nonce: v.string(),
});

export type ProviderOpenJobConnectionData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderOpenJobConnection"),
  id: v.number(),
  data: DataSchema,
});
