import * as v from "valibot";

export const OutboundResponseFrameSchema = v.variant("type", [
  v.object({
    kind: v.literal("Response"),
    type: v.literal("Ack"),
    id: v.number(),
  }),
]);

export type OutboundResponseFrame = v.InferOutput<
  typeof OutboundResponseFrameSchema
>;
