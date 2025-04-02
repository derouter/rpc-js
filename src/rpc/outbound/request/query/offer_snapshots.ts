import * as v from "valibot";

const DataSchema = v.object({
  snapshot_ids: v.array(v.number()),
});

export type QueryOfferSnapshotsRequestData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryOfferSnapshots"),
  id: v.number(),
  data: DataSchema,
});
