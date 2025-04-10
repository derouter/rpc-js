import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const InvalidJobIdSchema = v.object({
  tag: v.literal("InvalidJobId"),
});

const InvalidConsumerPeerIdSchema = v.object({
  tag: v.literal("InvalidConsumerPeerId"),
});

const AlreadyFailedSchema = v.object({
  tag: v.literal("AlreadyFailed"),
  content: v.object({
    reason: v.string(),
    reason_class: v.nullish(v.number()),
  }),
});

const AlreadyCompletedSchema = v.object({
  tag: v.literal("AlreadyCompleted"),
});

const InvalidBalanceDeltaSchema = v.object({
  tag: v.literal("InvalidBalanceDelta"),
});

const ErroneousDataSchema = v.variant("tag", [
  InvalidConsumerPeerIdSchema,
  InvalidJobIdSchema,
  AlreadyFailedSchema,
  AlreadyCompletedSchema,
  InvalidBalanceDeltaSchema,
]);

export class ConsumerCompleteJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  InvalidConsumerPeerIdSchema,
  InvalidJobIdSchema,
  AlreadyFailedSchema,
  AlreadyCompletedSchema,
  InvalidBalanceDeltaSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerCompleteJob"),
  id: v.number(),
  data: DataSchema,
});
