import * as v from "valibot";
import { OfferSnapshotSchema } from "../../dto.js";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.array(OfferSnapshotSchema),
});

const LengthSchema = v.object({
  tag: v.literal("Length"),
});

const ErroneousDataSchema = v.variant("tag", [LengthSchema]);

export class QueryOfferSnapshotsError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, LengthSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("QueryOfferSnapshots"),
  id: v.number(),
  data: DataSchema,
});
