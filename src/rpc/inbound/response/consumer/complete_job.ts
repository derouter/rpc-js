import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const InvalidConsumerPeerIdSchema = v.object({
  tag: v.literal("InvalidConsumerPeerId"),
  content: v.object({ message: v.string() }),
});

const InvalidJobIdSchema = v.object({
  tag: v.literal("InvalidJobId"),
});

const NotSyncedYetSchema = v.object({
  tag: v.literal("NotSyncedYet"),
});

const AlreadyCompletedSchema = v.object({
  tag: v.literal("AlreadyCompleted"),
});

const InvalidBalanceDeltaSchema = v.object({
  tag: v.literal("InvalidBalanceDelta"),
  content: v.object({ message: v.string() }),
});

const ErroneousDataSchema = v.variant("tag", [
  InvalidConsumerPeerIdSchema,
  InvalidJobIdSchema,
  NotSyncedYetSchema,
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
  NotSyncedYetSchema,
  AlreadyCompletedSchema,
  InvalidBalanceDeltaSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerCompleteJob"),
  id: v.number(),
  data: DataSchema,
});
