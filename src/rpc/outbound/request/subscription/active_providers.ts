import * as v from "valibot";

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("SubscribeToActiveProviders"),
  id: v.number(),
  data: v.object({}),
});
