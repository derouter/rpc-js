import * as v from "valibot";

const DataSchema = v.object({
  provider_peer_ids: v.array(v.string()),
});

export type QueryProvidersRequestData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryProviders"),
  id: v.number(),
  data: DataSchema,
});
