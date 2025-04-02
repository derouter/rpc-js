import * as v from "valibot";

const DataSchema = v.object({
  offer_snapshot_id: v.number(),
  currency: v.number(),
});

export type ConsumerOpenConnectionData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerOpenConnection"),
  id: v.number(),
  data: DataSchema,
});
