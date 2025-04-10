import * as v from "valibot";

export const QueryOfferSnapshotsRequestDataSchema = v.object({
  snapshot_ids: v.array(v.number()),
});

export type QueryOfferSnapshotsRequestData = v.InferInput<
  typeof QueryOfferSnapshotsRequestDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("QueryOfferSnapshots"),
  id: v.number(),
  data: QueryOfferSnapshotsRequestDataSchema,
});
