import * as v from "valibot";

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("Ack"),
  id: v.number(),
  data: v.undefined(),
});
