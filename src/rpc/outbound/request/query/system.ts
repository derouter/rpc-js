import * as v from "valibot";

const DataSchema = v.object({});

export type QuerySystemRequestData = v.InferInput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QuerySystem"),
  id: v.number(),
  data: DataSchema,
});
