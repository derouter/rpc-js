import * as v from "valibot";
import { OfferSnapshotSchema } from "../../dto.js";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.array(OfferSnapshotSchema),
});

const InvalidPeerIdSchema = v.object({
  tag: v.literal("InvalidPeerId"),
  content: v.string(),
});

const ErroneousDataSchema = v.variant("tag", [InvalidPeerIdSchema]);

export class QueryActiveOffersError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, InvalidPeerIdSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("QueryActiveOffers"),
  id: v.number(),
  data: DataSchema,
});
