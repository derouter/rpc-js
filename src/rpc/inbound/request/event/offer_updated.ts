import * as v from "valibot";
import { OfferSnapshotSchema } from "../../dto.js";

export const DataSchema = v.object({
  subscription_id: v.number(),
  payload: OfferSnapshotSchema,
});

export type EventOfferUpdatedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("EventOfferUpdated"),
  id: v.number(),
  data: DataSchema,
});
