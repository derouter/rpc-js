import * as v from "valibot";

const DataSchema = v.object({
  subscription_id: v.number(),
});

export type CancelSubscriptionRequestData = v.InferInput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("CancelSubscription"),
  id: v.number(),
  data: DataSchema,
});
