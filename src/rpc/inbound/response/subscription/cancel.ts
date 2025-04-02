import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const InvalidSubscriptionIdSchema = v.object({
  tag: v.literal("InvalidSubscriptionId"),
});

const ErroneousDataSchema = v.variant("tag", [InvalidSubscriptionIdSchema]);

export class CancelSubscriptionError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, InvalidSubscriptionIdSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("CancelSubscription"),
  id: v.number(),
  data: DataSchema,
});
