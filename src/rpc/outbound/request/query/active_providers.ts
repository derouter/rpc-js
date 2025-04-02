import * as v from "valibot";

const DataSchema = v.object({});

export type QueryActiveProvidersRequestData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryActiveProviders"),
  id: v.number(),
  data: DataSchema,
});
