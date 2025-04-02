import * as v from "valibot";
import { OfferRemovedSchema } from "../../dto.js";

export const DataSchema = v.object({
  subscription_id: v.number(),
  payload: OfferRemovedSchema,
});

export type EventOfferRemovedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("EventOfferRemoved"),
  id: v.number(),
  data: DataSchema,
});
